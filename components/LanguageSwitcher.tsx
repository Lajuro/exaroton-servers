'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Loader2, Languages } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from '@/lib/useTranslations';
import { type Locale, locales, localeNames, localeCountryCodes, defaultLocale } from '@/lib/i18n-config';
import { cn } from '@/lib/utils';

// Flag component using flag-icons library
function Flag({ countryCode, className }: { countryCode: string; className?: string }) {
  return (
    <span 
      className={cn(
        "fi inline-block rounded-sm shadow-sm",
        `fi-${countryCode}`,
        className
      )}
      aria-hidden="true"
    />
  );
}

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('language');

  useEffect(() => {
    // Read current locale from cookie or document
    const localeCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined;
    
    if (localeCookie && locales.includes(localeCookie)) {
      setCurrentLocale(localeCookie);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language;
      const matchingLocale = locales.find(l => browserLang.startsWith(l.split('-')[0]));
      if (matchingLocale) {
        setCurrentLocale(matchingLocale);
      }
    }
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const previousLocale = currentLocale;
    
    // Set cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setCurrentLocale(locale);
    setIsOpen(false);
    
    // Show toast notification with the new language name
    toast({
      title: t('changed'),
      description: t('changedTo', { language: localeNames[locale] }),
      duration: 3000,
    });
    
    // Refresh the page to apply the new locale
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "h-9 gap-2 px-3 transition-all duration-200",
            isPending && "opacity-70 cursor-wait"
          )}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Flag countryCode={localeCountryCodes[currentLocale]} className="!w-5 !h-4" />
          )}
          <span className="hidden sm:inline-block text-sm font-medium">
            {currentLocale.split('-')[0].toUpperCase()}
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
          <span className="sr-only">{t('switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[200px] animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Languages className="h-3.5 w-3.5" />
          {t('selectLanguage')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((locale) => {
          const isSelected = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "flex items-center gap-3 cursor-pointer transition-colors duration-150",
                isSelected && "bg-accent/50"
              )}
            >
              <Flag countryCode={localeCountryCodes[locale]} className="!w-6 !h-5" />
              <div className="flex flex-col flex-1">
                <span className={cn(
                  "text-sm",
                  isSelected && "font-medium"
                )}>
                  {localeNames[locale]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {locale}
                </span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

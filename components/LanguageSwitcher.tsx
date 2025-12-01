'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

type Locale = 'pt-BR' | 'en';

const locales: Locale[] = ['pt-BR', 'en'];

const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en': 'English',
};

const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en': '🇺🇸',
};

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('pt-BR');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    // Set cookie
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setCurrentLocale(locale);
    
    // Refresh the page to apply the new locale
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Mudar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && (
              <Check className="h-4 w-4 ml-auto text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

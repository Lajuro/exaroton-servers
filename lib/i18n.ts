import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Re-export shared configuration for backwards compatibility
export { type Locale, locales, defaultLocale, localeNames, localeFlags, localeCountryCodes } from './i18n-config';
import { type Locale, locales, defaultLocale } from './i18n-config';

async function getLocale(): Promise<Locale> {
  // Try to get from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie;
  }

  // Try to get from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('Accept-Language');
  
  if (acceptLanguage) {
    // Parse Accept-Language header
    const languages = acceptLanguage.split(',').map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    }).sort((a, b) => b.quality - a.quality);

    for (const { code } of languages) {
      // Check exact match
      if (locales.includes(code as Locale)) {
        return code as Locale;
      }
      // Check language without region (e.g., 'pt' matches 'pt-BR')
      const baseCode = code.split('-')[0];
      const matchingLocale = locales.find(l => l.startsWith(baseCode));
      if (matchingLocale) {
        return matchingLocale;
      }
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

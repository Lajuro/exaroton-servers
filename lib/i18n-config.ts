// Shared i18n configuration (can be used in both client and server components)

export type Locale = 'pt-BR' | 'en' | 'es';

export const locales: Locale[] = ['pt-BR', 'en', 'es'];
export const defaultLocale: Locale = 'pt-BR';

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en': 'English',
  'es': 'Español',
};

// ISO 3166-1 alpha-2 country codes for flag-icons library
export const localeCountryCodes: Record<Locale, string> = {
  'pt-BR': 'br',
  'en': 'us',
  'es': 'es',
};

// Keep emoji flags as fallback
export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en': '🇺🇸',
  'es': '🇪🇸',
};

// Shared i18n configuration (can be used in both client and server components)

export type Locale = 'pt-BR' | 'en';

export const locales: Locale[] = ['pt-BR', 'en'];
export const defaultLocale: Locale = 'pt-BR';

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en': 'English',
};

// ISO 3166-1 alpha-2 country codes for flag-icons library
export const localeCountryCodes: Record<Locale, string> = {
  'pt-BR': 'br',
  'en': 'us',
};

// Keep emoji flags as fallback
export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'en': '🇺🇸',
};

'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

// Re-export for convenience
export { useLocale, useNow, useTimeZone } from 'next-intl';

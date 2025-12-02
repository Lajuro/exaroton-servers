'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { GlobalLoading } from '@/components/GlobalLoading';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations('common');

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <GlobalLoading message={t('redirecting')} />;
}

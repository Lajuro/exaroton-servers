'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Mostra o skeleton do dashboard enquanto verifica auth e redireciona
  // Isso evita um loading genérico que depois muda para o skeleton específico
  return <DashboardSkeleton />;
}

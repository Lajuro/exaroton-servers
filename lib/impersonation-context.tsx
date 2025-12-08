'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';

interface ImpersonationContextType {
  /** O usuário que está sendo simulado (null se não estiver simulando) */
  impersonatedUser: User | null;
  /** Se está no modo de impersonation */
  isImpersonating: boolean;
  /** Inicia a simulação de um usuário */
  startImpersonation: (user: User) => void;
  /** Encerra a simulação e volta ao admin */
  stopImpersonation: () => void;
  /** O usuário efetivo (impersonado ou real) */
  getEffectiveUser: (realUser: User | null) => User | null;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonatedUser: null,
  isImpersonating: false,
  startImpersonation: () => {},
  stopImpersonation: () => {},
  getEffectiveUser: (realUser) => realUser,
});

const STORAGE_KEY = 'impersonation_user';

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Recuperar estado do sessionStorage ao carregar
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Converter datas de string para Date
        if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
        if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
        setImpersonatedUser(parsed);
      }
    } catch (error) {
      console.error('Error loading impersonation state:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setIsHydrated(true);
  }, []);

  const startImpersonation = useCallback((user: User) => {
    setImpersonatedUser(user);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving impersonation state:', error);
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing impersonation state:', error);
    }
  }, []);

  const getEffectiveUser = useCallback((realUser: User | null): User | null => {
    // Se está impersonando e o usuário real é admin, retorna o usuário impersonado
    if (impersonatedUser && realUser?.isAdmin) {
      return impersonatedUser;
    }
    return realUser;
  }, [impersonatedUser]);

  const isImpersonating = Boolean(impersonatedUser);

  // Não renderizar até hidratar para evitar mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <ImpersonationContext.Provider 
      value={{ 
        impersonatedUser, 
        isImpersonating, 
        startImpersonation, 
        stopImpersonation,
        getEffectiveUser,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export const useImpersonation = () => useContext(ImpersonationContext);

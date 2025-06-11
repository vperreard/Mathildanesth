'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function NewLeavePageFrench() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/connexion');
      } else {
        router.push('/conges?newRequest=true');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );
}

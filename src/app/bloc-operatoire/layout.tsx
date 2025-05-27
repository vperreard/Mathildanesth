import { ReactNode } from 'react';
import { Metadata } from 'next';
import BlocOperatoireNav from './_components/BlocOperatoireNav';
import OptimizedProvider from './_components/OptimizedProvider';

export const metadata: Metadata = {
  title: 'Bloc Opératoire | Mathildanesth',
  description: 'Gestion du bloc opératoire - Planning, salles, secteurs et règles',
};

interface BlocOperatoireLayoutProps {
  children: ReactNode;
}

export default function BlocOperatoireLayout({ children }: BlocOperatoireLayoutProps) {
  return (
    <OptimizedProvider>
      <div className="flex flex-col h-full">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlocOperatoireNav />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </OptimizedProvider>
  );
}
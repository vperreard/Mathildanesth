import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System Médical | Mathildanesth',
  description: 'Composants UI optimisés pour les équipes médicales',
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
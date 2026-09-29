import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Harness IA',
  description: 'Estude engenharia de software com um tutor de IA.',
};

type AppRouteLayoutProps = {
  children: ReactNode;
};

export default function AppRouteLayout({ children }: AppRouteLayoutProps) {
  return children;
}

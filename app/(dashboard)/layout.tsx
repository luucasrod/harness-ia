import type { ReactNode } from 'react';

import DashboardShell from '@/components/DashboardShell';

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * Chrome shared by every authenticated route. The shell owns the application
 * navigation; reading views such as the lesson page compose their own
 * module-index sidebar inside the content area.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}

'use client';

import { useEffect } from 'react';

export default function DashboardBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set body class for AdminLTE dashboard
    document.body.className = 'layout-fixed sidebar-expand-lg sidebar-open bg-body-tertiary';
    return () => {
      document.body.className = '';
    };
  }, []);

  return <>{children}</>;
}


import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import ReportsPage from '@/components/ReportsPage';

export default async function Reports() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <BreadcrumbHeader
        title="Laporan Pelatihan"
        breadcrumbs={[
          { label: 'Beranda', href: '/dashboard' },
          { label: 'Laporan' },
        ]}
      />
      <ReportsPage />
    </>
  );
}


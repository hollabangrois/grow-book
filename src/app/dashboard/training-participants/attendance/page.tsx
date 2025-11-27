import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import AttendanceTable from '@/components/AttendanceTable';

export default async function AttendancePage() {
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
        title="Kehadiran Pelatihan"
        breadcrumbs={[
          { label: 'Beranda', href: '/dashboard' },
          { label: 'Peserta Pelatihan', href: '/dashboard/training-participants/attendance' },
          { label: 'Kehadiran' },
        ]}
      />
      <AttendanceTable />
    </>
  );
}


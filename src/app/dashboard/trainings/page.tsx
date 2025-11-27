import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import TrainingsTable from '@/components/TrainingsTable';

export default async function TrainingsPage() {
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
        title="Trainings"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Trainings' },
        ]}
      />
      <TrainingsTable />
    </>
  );
}

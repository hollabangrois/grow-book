import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import ParticipantsTable from '@/components/ParticipantsTable';

export default async function ParticipantsPage() {
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
        title="Participants"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Participants' },
        ]}
      />
      <ParticipantsTable />
    </>
  );
}

import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import RegisterParticipantForm from '@/components/RegisterParticipantForm';

export default async function RegisterParticipantPage() {
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
        title="Register Participant to Training"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Training Participants', href: '/dashboard/training-participants/register' },
          { label: 'Register' },
        ]}
      />
      <RegisterParticipantForm />
    </>
  );
}


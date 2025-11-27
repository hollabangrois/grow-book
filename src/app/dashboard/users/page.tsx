import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import UsersTable from '@/components/UsersTable';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    redirect('/login');
  }

  // Only admin can access
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <BreadcrumbHeader
        title="Users"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Users' },
        ]}
      />
      <UsersTable />
    </>
  );
}

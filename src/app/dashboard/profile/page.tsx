import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import DashboardBreadcrumb from '@/components/DashboardBreadcrumb';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <>
      <DashboardBreadcrumb />
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header p-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <a className="nav-link active" href="#settings" data-bs-toggle="tab">
                    Pengaturan
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#activity" data-bs-toggle="tab">
                    Aktivitas
                  </a>
                </li>
              </ul>
            </div>
            <div className="card-body">
              <div className="tab-content">
                <div className="active tab-pane" id="settings">
                  <ProfileForm user={user} />
                </div>
                <div className="tab-pane" id="activity">
                  <div className="post">
                    <div className="user-block">
                      <span className="username">
                        <a href="#">Akun Dibuat</a>
                      </span>
                      <span className="description">
                        {new Date(user.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p>Akun Anda berhasil dibuat.</p>
                  </div>
                  {user.last_login && (
                    <div className="post">
                      <div className="user-block">
                        <span className="username">
                          <a href="#">Login Terakhir</a>
                        </span>
                        <span className="description">
                          {new Date(user.last_login).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p>Anda terakhir masuk ke sistem.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


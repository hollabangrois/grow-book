import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import DashboardBody from './DashboardBody';
import SidebarMenu from './SidebarMenu';
import SidebarToggle from './SidebarToggle';
import Script from 'next/script';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3@5.0.12/index.css"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/styles/overlayscrollbars.min.css"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href="/adminlte/css/adminlte.css" />
      <DashboardBody>
      <SidebarToggle />
      <div style={{ minHeight: '100vh' }}>
          <div className="app-wrapper">
            {/* Header */}
            <nav className="app-header navbar navbar-expand bg-body">
              <div className="container-fluid">
                <ul className="navbar-nav">
                  <li className="nav-item">
                    <a className="nav-link" data-lte-toggle="sidebar" href="#" role="button">
                      <i className="bi bi-list"></i>
                    </a>
                  </li>
                  <li className="nav-item d-none d-md-block">
                    <a href="/dashboard" className="nav-link">Beranda</a>
                  </li>
                </ul>
                <ul className="navbar-nav ms-auto">
                  <li className="nav-item dropdown user-menu">
                    <a 
                      href="#" 
                      className="nav-link dropdown-toggle" 
                      data-bs-toggle="dropdown"
                    >
                      <span className="d-none d-md-inline" style={{ whiteSpace: 'nowrap' }}>
                        {user.name || user.email}
                      </span>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                      <li className="user-header text-bg-primary">
                        <p>
                          {user.name || user.email}
                          <small>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</small>
                        </p>
                      </li>
                      <li className="user-footer">
                        <a href="/dashboard/profile" className="btn btn-default btn-flat">Profil</a>
                        <LogoutButton />
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Sidebar */}
            <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
              <div className="sidebar-brand">
                <Link href="/dashboard" className="brand-link">
                  <img
                    src="/adminlte/assets/img/AdminLTELogo.png"
                    alt="Grow Book Logo"
                    className="brand-image opacity-75 shadow"
                  />
                  <span className="brand-text fw-semibold">Grow Book</span>
                </Link>
              </div>
              <div className="sidebar-wrapper">
                <SidebarMenu userRole={user.role} />
              </div>
            </aside>

            {/* Main Content */}
            <main className="app-main" id="main-content">
              <div className="app-content">
                <div className="container-fluid" style={{ paddingLeft: '15px', paddingRight: '15px' }}>{children}</div>
              </div>
            </main>

            {/* Footer */}
            <footer className="app-footer">
              <div className="float-end d-none d-sm-inline">Sistem Manajemen Pelatihan Grow Book</div>
              <strong>
                Chat programmer&nbsp;
                <a 
                  href="https://wa.me/6282199994445" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  Grow Book
                </a>.
              </strong>
            </footer>
          </div>

          <Script
            src="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/browser/overlayscrollbars.browser.es6.min.js"
            crossOrigin="anonymous"
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
            crossOrigin="anonymous"
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"
            crossOrigin="anonymous"
          />
          <Script src="/adminlte/js/adminlte.js" />
          <Script id="overlayscrollbars-config">
            {`
              const SELECTOR_SIDEBAR_WRAPPER = '.sidebar-wrapper';
              const Default = {
                scrollbarTheme: 'os-theme-light',
                scrollbarAutoHide: 'leave',
                scrollbarClickScroll: true,
              };
              document.addEventListener('DOMContentLoaded', function () {
                const sidebarWrapper = document.querySelector(SELECTOR_SIDEBAR_WRAPPER);
                if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined) {
                  OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
                    scrollbars: {
                      theme: Default.scrollbarTheme,
                      autoHide: Default.scrollbarAutoHide,
                      clickScroll: Default.scrollbarClickScroll,
                    },
                  });
                }
              });
            `}
          </Script>
          <Script id="sidebar-overlay-config">
            {`
              function ensureSidebarOverlay() {
                const sidebarOverlay = document.querySelector('.sidebar-overlay');
                if (sidebarOverlay) {
                  const overlayElement = sidebarOverlay;
                  overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                  overlayElement.style.cursor = 'pointer';
                  overlayElement.style.zIndex = '1037';
                } else {
                  setTimeout(ensureSidebarOverlay, 100);
                }
              }
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(ensureSidebarOverlay, 300);
                });
              } else {
                setTimeout(ensureSidebarOverlay, 300);
              }
            `}
          </Script>
      </div>
      </DashboardBody>
    </>
  );
}


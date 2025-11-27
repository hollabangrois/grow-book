'use client';

import { usePathname } from 'next/navigation';

export default function DashboardBreadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumb = () => {
    if (pathname === '/dashboard') {
      return { title: 'Dashboard', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Dashboard', active: true }] };
    }
    if (pathname === '/dashboard/profile') {
      return { title: 'Profil', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Profil', active: true }] };
    }
    if (pathname?.startsWith('/dashboard/trainings')) {
      return { title: 'Pelatihan', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Pelatihan', active: true }] };
    }
    if (pathname?.startsWith('/dashboard/participants')) {
      return { title: 'Peserta', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Peserta', active: true }] };
    }
    if (pathname?.startsWith('/dashboard/users')) {
      return { title: 'Pengguna', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Pengguna', active: true }] };
    }
    if (pathname?.startsWith('/dashboard/reports')) {
      return { title: 'Laporan', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Laporan', active: true }] };
    }
    if (pathname?.startsWith('/dashboard/training-participants')) {
      return { title: 'Peserta Pelatihan', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Peserta Pelatihan', active: true }] };
    }
    return { title: 'Dashboard', items: [{ label: 'Beranda', href: '/dashboard' }, { label: 'Dashboard', active: true }] };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="app-content-header">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6">
            <h3 className="mb-0">{breadcrumb.title}</h3>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-end">
              {breadcrumb.items.map((item, index) => (
                <li
                  key={index}
                  className={`breadcrumb-item ${item.active ? 'active' : ''}`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.active ? item.label : <a href={item.href}>{item.label}</a>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}


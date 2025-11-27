interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

export default function BreadcrumbHeader({ title, breadcrumbs }: BreadcrumbHeaderProps) {
  return (
    <div className="app-content-header">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6">
            <h3 className="mb-0">{title}</h3>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-end">
              {breadcrumbs.map((item, index) => (
                <li
                  key={index}
                  className={`breadcrumb-item ${!item.href ? 'active' : ''}`}
                  aria-current={!item.href ? 'page' : undefined}
                >
                  {item.href ? <a href={item.href}>{item.label}</a> : item.label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

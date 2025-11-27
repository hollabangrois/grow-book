import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grow Book | Login',
  description: 'Login to Grow Book Training Management System',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {children}
    </>
  );
}


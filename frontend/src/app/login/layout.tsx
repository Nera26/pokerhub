export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" role="main" className="min-h-dvh">
      {children}
    </main>
  );
}

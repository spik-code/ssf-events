import "./admin.css";

/**
 * Shell for everything under /admin.
 *
 * Deliberately does no auth work: /admin/login has to render for signed-out
 * visitors. The gate lives in app/admin/(dash)/layout.tsx, which wraps every
 * page except login.
 */
export const metadata = {
  title: { default: "Admin", template: "%s · SSF Admin" },
  // Keep the admin out of search results entirely.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

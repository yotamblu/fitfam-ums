import AdminShell from "@/components/AdminShell";

// Every admin page shares one login/header, so the session survives navigating between pages.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

import SuperAdminLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminLayoutClient>{children}</SuperAdminLayoutClient>;
}

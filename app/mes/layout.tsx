import MesLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";

export default function MesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MesLayoutClient>{children}</MesLayoutClient>;
}

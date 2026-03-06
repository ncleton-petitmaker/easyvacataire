import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous a EasyVacataire avec votre numero WhatsApp pour acceder a la gestion de vos creneaux et disponibilites.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

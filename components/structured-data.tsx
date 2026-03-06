export function StructuredData() {
  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EasyVacataire",
    description:
      "Plateforme open source de mise en relation entre etablissements et enseignants vacataires. Simplifiez la gestion de vos intervenants.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://easyvacataire.fr",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EasyVacataire",
    url: "https://easyvacataire.fr",
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@easyvacataire.fr",
      contactType: "customer service",
      availableLanguage: "French",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplication),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization),
        }}
      />
    </>
  );
}

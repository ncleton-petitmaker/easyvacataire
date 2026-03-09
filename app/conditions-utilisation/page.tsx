import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — EasyVacataire",
  description: "Conditions générales d'utilisation de la plateforme EasyVacataire.",
};

export default function ConditionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-700"
      >
        &larr; Retour à l&apos;accueil
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Dernière mise à jour : 9 mars 2026
      </p>

      <div className="space-y-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            1. Objet
          </h2>
          <p>
            Les présentes conditions générales d&apos;utilisation (CGU) régissent
            l&apos;accès et l&apos;utilisation de la plateforme EasyVacataire,
            éditée par EasyVacataire, accessible à l&apos;adresse
            easyvacataire.fr. La plateforme facilite la mise en relation entre
            établissements d&apos;enseignement supérieur et intervenants
            vacataires.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            2. Acceptation des conditions
          </h2>
          <p>
            L&apos;utilisation de la plateforme implique l&apos;acceptation pleine
            et entière des présentes CGU. Si vous n&apos;acceptez pas ces
            conditions, veuillez ne pas utiliser la plateforme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            3. Description du service
          </h2>
          <p>
            EasyVacataire permet aux établissements d&apos;enseignement supérieur
            de gérer leurs intervenants vacataires : publication de créneaux,
            gestion des disponibilités, communication via WhatsApp, suivi
            administratif, suivi des heures équivalent TD (HeTD) et des
            paiements.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            4. Inscription et compte utilisateur
          </h2>
          <p>
            L&apos;accès à la plateforme nécessite une authentification par code
            OTP envoyé par email. Seuls les utilisateurs préalablement
            enregistrés par un administrateur d&apos;établissement ou un
            super-administrateur peuvent se connecter. Chaque utilisateur est
            responsable de la confidentialité de son accès.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            5. Utilisation du service
          </h2>
          <p>L&apos;utilisateur s&apos;engage à :</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Utiliser la plateforme conformément à sa destination</li>
            <li>Fournir des informations exactes et à jour</li>
            <li>Ne pas tenter de compromettre la sécurité de la plateforme</li>
            <li>Respecter les droits des autres utilisateurs</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            6. Intégration Google Calendar
          </h2>
          <p>
            La plateforme permet aux intervenants de connecter leur compte Google
            pour synchroniser leurs créneaux d&apos;indisponibilité via Google
            Calendar. Cette fonctionnalité utilise l&apos;API Google Calendar en
            mode lecture seule (scope <code>calendar.freebusy</code>). Les
            données récupérées (créneaux occupés) sont utilisées uniquement pour
            afficher les indisponibilités sur le planning et ne sont pas
            stockées de manière permanente. L&apos;utilisateur peut déconnecter
            son compte Google à tout moment depuis son espace personnel.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            7. Données personnelles
          </h2>
          <p>
            Le traitement des données personnelles est décrit dans notre{" "}
            <a
              href="/politique-de-confidentialite"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              politique de confidentialité
            </a>
            . En utilisant la plateforme, vous consentez au traitement de vos
            données conformément à cette politique et au RGPD.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            8. Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des contenus de la plateforme (textes, images, logos,
            code source) sont protégés par le droit de la propriété
            intellectuelle et restent la propriété exclusive d&apos;EasyVacataire
            ou de ses partenaires.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            9. Responsabilité
          </h2>
          <p>
            EasyVacataire met tout en œuvre pour assurer la disponibilité et le
            bon fonctionnement de la plateforme, mais ne saurait être tenu
            responsable des interruptions, erreurs ou pertes de données.
            L&apos;utilisation de la plateforme se fait aux risques et périls de
            l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            10. Modification des CGU
          </h2>
          <p>
            EasyVacataire se réserve le droit de modifier les présentes CGU à
            tout moment. Les utilisateurs seront informés des modifications
            significatives. La poursuite de l&apos;utilisation de la plateforme
            après modification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            11. Droit applicable
          </h2>
          <p>
            Les présentes CGU sont régies par le droit français. Tout litige
            relatif à leur interprétation ou exécution relève de la compétence
            des tribunaux français.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            12. Contact
          </h2>
          <p>
            Pour toute question relative aux présentes CGU, vous pouvez nous
            contacter à l&apos;adresse{" "}
            <a
              href="mailto:contact@easyvacataire.fr"
              className="text-blue-600 underline"
            >
              contact@easyvacataire.fr
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

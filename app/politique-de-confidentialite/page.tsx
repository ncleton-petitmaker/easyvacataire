import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — EasyVacataire",
  description:
    "Politique de confidentialité et de protection des données personnelles d'EasyVacataire, conforme au RGPD.",
};

export default function PolitiqueDeConfidentialite() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-700"
      >
        &larr; Retour à l&apos;accueil
      </Link>

      <h1 className="mb-4 text-3xl font-bold text-zinc-900">
        Politique de confidentialité
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        Dernière mise à jour : 9 mars 2026
      </p>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          1. Responsable du traitement
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Le responsable du traitement des données personnelles collectées via le
          site{" "}
          <a
            href="https://easyvacataire.fr"
            className="text-blue-600 underline"
          >
            easyvacataire.fr
          </a>{" "}
          est :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>EasyVacataire</strong>
          </li>
          <li>
            Email de contact :{" "}
            <a
              href="mailto:contact@easyvacataire.fr"
              className="text-blue-600 underline"
            >
              contact@easyvacataire.fr
            </a>
          </li>
        </ul>
      </section>

      {/* 2 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          2. Données personnelles collectées
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Dans le cadre de l&apos;utilisation de la plateforme EasyVacataire,
          nous sommes amenés à collecter les données personnelles suivantes :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Nom et prénom</strong> de l&apos;intervenant
          </li>
          <li>
            <strong>Adresse email</strong> — utilisée pour l&apos;authentification
            par code OTP et les notifications
          </li>
          <li>
            <strong>Numéro de téléphone WhatsApp</strong> — utilisé pour
            l&apos;envoi de notifications et la communication via
            l&apos;assistant conversationnel
          </li>
          <li>
            <strong>Disponibilités</strong> — créneaux horaires renseignés par
            l&apos;intervenant
          </li>
          <li>
            <strong>Matières enseignées</strong> et préférences
          </li>
          <li>
            <strong>Données Google Calendar</strong> (le cas échéant) — créneaux
            d&apos;indisponibilité récupérés via l&apos;API Google Calendar,
            utilisés uniquement pour l&apos;affichage sur le planning
          </li>
        </ul>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          3. Finalités du traitement
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Les données collectées sont utilisées pour les finalités suivantes :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            Gestion et synchronisation des disponibilités des intervenants avec
            les besoins de l&apos;établissement
          </li>
          <li>
            Envoi de notifications via email et WhatsApp (rappels, mises à jour de
            planning)
          </li>
          <li>
            Fonctionnement de l&apos;assistant conversationnel basé sur
            l&apos;intelligence artificielle
          </li>
          <li>Matching automatique entre besoins et disponibilités</li>
          <li>
            Suivi des heures équivalent TD (HeTD) et gestion des paiements
          </li>
          <li>
            Gestion administrative de la relation entre l&apos;établissement et
            les intervenants
          </li>
        </ul>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          4. Base légale du traitement
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Le traitement des données personnelles repose sur :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>L&apos;intérêt légitime</strong> de l&apos;établissement à
            organiser la planification de ses intervenants
          </li>
          <li>
            <strong>Le consentement</strong> de l&apos;intervenant lors de la
            communication de ses informations et disponibilités
          </li>
          <li>
            <strong>L&apos;exécution d&apos;un contrat</strong> ou de mesures
            précontractuelles dans le cadre de la relation entre
            l&apos;établissement et l&apos;intervenant
          </li>
        </ul>
      </section>

      {/* 5 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          5. Sous-traitants et services tiers
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Pour assurer le fonctionnement de la plateforme, nous faisons appel
          aux services tiers suivants :
        </p>
        <ul className="list-inside list-disc space-y-2 text-zinc-600">
          <li>
            <strong>Supabase</strong> — base de données et authentification. Les
            données sont hébergées en Europe.
          </li>
          <li>
            <strong>Hetzner</strong> (Allemagne) — hébergement de
            l&apos;infrastructure serveur. Les données sont hébergées en Europe
            (Allemagne), conformément au RGPD.
          </li>
          <li>
            <strong>Resend</strong> — service d&apos;envoi d&apos;emails
            transactionnels (codes OTP, notifications).
          </li>
          <li>
            <strong>WhatsApp / Evolution API</strong> — utilisé pour l&apos;envoi
            de notifications et la communication avec les intervenants via
            WhatsApp.
          </li>
          <li>
            <strong>Google Calendar API</strong> — utilisé pour récupérer les
            créneaux d&apos;indisponibilité des intervenants ayant connecté leur
            compte Google. Seul le scope <code>calendar.freebusy</code> (lecture
            seule des disponibilités) est utilisé.{" "}
            <strong>
              Aucun événement n&apos;est lu, créé ou modifié dans le calendrier
              de l&apos;utilisateur.
            </strong>
          </li>
          <li>
            <strong>Mistral AI</strong> — moteur de l&apos;assistant
            conversationnel. Les messages envoyés à Mistral AI sont traités en
            temps réel pour générer des réponses.{" "}
            <strong>
              Aucune donnée personnelle n&apos;est conservée par Mistral AI
            </strong>{" "}
            après le traitement de la requête.
          </li>
        </ul>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          6. Hébergement des données
        </h2>
        <p className="leading-relaxed text-zinc-600">
          L&apos;ensemble des données personnelles collectées par EasyVacataire
          est hébergé en <strong>Europe</strong>, principalement chez{" "}
          <strong>Hetzner</strong> en Allemagne. Ce choix garantit la conformité
          avec le Règlement Général sur la Protection des Données (RGPD) et
          assure un niveau de protection élevé des données.
        </p>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          7. Durée de conservation des données
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Les données personnelles sont conservées pour la durée strictement
          nécessaire aux finalités décrites ci-dessus :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Données des intervenants</strong> (nom, téléphone,
            disponibilités) : conservées pendant la durée de la collaboration
            avec l&apos;établissement, puis supprimées dans un délai de 12 mois
            après la fin de la relation.
          </li>
          <li>
            <strong>Tokens Google OAuth</strong> : conservés tant que
            l&apos;utilisateur maintient la connexion Google Calendar active.
            Supprimés immédiatement lors de la déconnexion.
          </li>
          <li>
            <strong>Historique des conversations WhatsApp</strong> : conservé
            pendant 6 mois maximum à des fins d&apos;amélioration du service.
          </li>
          <li>
            <strong>Logs techniques</strong> : conservés pendant 12 mois
            maximum.
          </li>
        </ul>
      </section>

      {/* 8 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          8. Cookies
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Le site EasyVacataire peut utiliser des cookies strictement nécessaires
          au fonctionnement du service, notamment :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Cookies de session</strong> — pour maintenir
            l&apos;authentification des utilisateurs connectés
          </li>
          <li>
            <strong>Cookies techniques</strong> — pour assurer le bon
            fonctionnement de la plateforme
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-600">
          Aucun cookie publicitaire ou de suivi marketing n&apos;est utilisé sur
          la plateforme.
        </p>
      </section>

      {/* 9 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          9. Droits des utilisateurs
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Conformément au RGPD, vous disposez des droits suivants concernant vos
          données personnelles :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Droit d&apos;accès</strong> — obtenir la confirmation que
            des données vous concernant sont traitées et en recevoir une copie
          </li>
          <li>
            <strong>Droit de rectification</strong> — demander la correction de
            données inexactes ou incomplètes
          </li>
          <li>
            <strong>Droit à l&apos;effacement</strong> — demander la suppression
            de vos données personnelles
          </li>
          <li>
            <strong>Droit à la portabilité</strong> — recevoir vos données dans
            un format structuré et lisible par machine
          </li>
          <li>
            <strong>Droit d&apos;opposition</strong> — vous opposer au
            traitement de vos données pour des motifs légitimes
          </li>
          <li>
            <strong>Droit à la limitation du traitement</strong> — demander la
            suspension du traitement de vos données dans certains cas
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-600">
          Pour exercer l&apos;un de ces droits, vous pouvez nous contacter à
          l&apos;adresse suivante :{" "}
          <a
            href="mailto:contact@easyvacataire.fr"
            className="text-blue-600 underline"
          >
            contact@easyvacataire.fr
          </a>
          . Nous nous engageons à répondre à votre demande dans un délai de 30
          jours.
        </p>
      </section>

      {/* 10 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          10. Sécurité des données
        </h2>
        <p className="leading-relaxed text-zinc-600">
          EasyVacataire met en œuvre des mesures techniques et
          organisationnelles appropriées pour protéger vos données personnelles
          contre tout accès non autorisé, toute modification, divulgation ou
          destruction. Les communications sont chiffrées via HTTPS et
          l&apos;accès aux données est strictement limité aux personnes
          autorisées.
        </p>
      </section>

      {/* 11 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          11. Contact — Délégué à la protection des données
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Pour toute question relative à la protection de vos données
          personnelles ou pour exercer vos droits, vous pouvez contacter notre
          responsable de la protection des données :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
          <li>
            Email :{" "}
            <a
              href="mailto:contact@easyvacataire.fr"
              className="text-blue-600 underline"
            >
              contact@easyvacataire.fr
            </a>
          </li>
        </ul>
      </section>

      {/* 12 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          12. Réclamation auprès d&apos;une autorité de contrôle
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Si vous estimez que le traitement de vos données personnelles
          constitue une violation du RGPD, vous avez le droit d&apos;introduire
          une réclamation auprès de la{" "}
          <strong>
            Commission Nationale de l&apos;Informatique et des Libertés (CNIL)
          </strong>{" "}
          :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
          <li>
            Site web :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              www.cnil.fr
            </a>
          </li>
        </ul>
      </section>

      {/* 13 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          13. Modifications de la politique de confidentialité
        </h2>
        <p className="leading-relaxed text-zinc-600">
          EasyVacataire se réserve le droit de modifier la présente politique de
          confidentialité à tout moment. En cas de modification substantielle,
          les utilisateurs en seront informés par les moyens de communication
          disponibles. La date de dernière mise à jour est indiquée en haut de
          cette page.
        </p>
      </section>
    </main>
  );
}

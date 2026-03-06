import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialite - EasyVacataire",
  description:
    "Politique de confidentialite et de protection des donnees personnelles d'EasyVacataire, conforme au RGPD.",
};

export default function PolitiqueDeConfidentialite() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-700"
      >
        &larr; Retour a l&apos;accueil
      </Link>

      <h1 className="mb-4 text-3xl font-bold text-zinc-900">
        Politique de confidentialite
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        Derniere mise a jour : 6 mars 2026
      </p>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          1. Responsable du traitement
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Le responsable du traitement des donnees personnelles collectees via le
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
          2. Donnees personnelles collectees
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Dans le cadre de l&apos;utilisation de la plateforme EasyVacataire,
          nous sommes amenes a collecter les donnees personnelles suivantes :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Nom et prenom</strong> de l&apos;intervenant
          </li>
          <li>
            <strong>Numero de telephone WhatsApp</strong> — utilise pour
            l&apos;envoi de notifications et la communication via
            l&apos;assistant conversationnel
          </li>
          <li>
            <strong>Disponibilites</strong> — creneaux horaires renseignes par
            l&apos;intervenant
          </li>
          <li>
            <strong>Matieres enseignees</strong> et preferences
          </li>
          <li>
            <strong>Adresse email</strong> (le cas echeant)
          </li>
        </ul>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          3. Finalites du traitement
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Les donnees collectees sont utilisees pour les finalites suivantes :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            Gestion et synchronisation des disponibilites des intervenants avec
            les besoins de l&apos;etablissement
          </li>
          <li>
            Envoi de notifications via WhatsApp (rappels, mises a jour de
            planning)
          </li>
          <li>
            Fonctionnement de l&apos;assistant conversationnel base sur
            l&apos;intelligence artificielle
          </li>
          <li>Matching automatique entre besoins et disponibilites</li>
          <li>
            Gestion administrative de la relation entre l&apos;etablissement et
            les intervenants
          </li>
        </ul>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          4. Base legale du traitement
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Le traitement des donnees personnelles repose sur :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>L&apos;interet legitime</strong> de l&apos;etablissement a
            organiser la planification de ses intervenants
          </li>
          <li>
            <strong>Le consentement</strong> de l&apos;intervenant lors de la
            communication de ses informations et disponibilites
          </li>
          <li>
            <strong>L&apos;execution d&apos;un contrat</strong> ou de mesures
            precontractuelles dans le cadre de la relation entre
            l&apos;etablissement et l&apos;intervenant
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
            <strong>Supabase</strong> — base de donnees et authentification. Les
            donnees sont hebergees en Europe.
          </li>
          <li>
            <strong>Hetzner</strong> (Allemagne) — hebergement de
            l&apos;infrastructure serveur. Les donnees sont hebergees en Europe
            (Allemagne), conformement au RGPD.
          </li>
          <li>
            <strong>WhatsApp / Evolution API</strong> — utilise pour l&apos;envoi
            de notifications et la communication avec les intervenants via
            WhatsApp.
          </li>
          <li>
            <strong>Mistral AI</strong> — moteur de l&apos;assistant
            conversationnel. Les messages envoyes a Mistral AI sont traites en
            temps reel pour generer des reponses.{" "}
            <strong>
              Aucune donnee personnelle n&apos;est conservee par Mistral AI
            </strong>{" "}
            apres le traitement de la requete.
          </li>
        </ul>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          6. Hebergement des donnees
        </h2>
        <p className="leading-relaxed text-zinc-600">
          L&apos;ensemble des donnees personnelles collectees par EasyVacataire
          est heberge en <strong>Europe</strong>, principalement chez{" "}
          <strong>Hetzner</strong> en Allemagne. Ce choix garantit la conformite
          avec le Reglement General sur la Protection des Donnees (RGPD) et
          assure un niveau de protection eleve des donnees.
        </p>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          7. Duree de conservation des donnees
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Les donnees personnelles sont conservees pour la duree strictement
          necessaire aux finalites decrites ci-dessus :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Donnees des intervenants</strong> (nom, telephone,
            disponibilites) : conservees pendant la duree de la collaboration
            avec l&apos;etablissement, puis supprimees dans un delai de 12 mois
            apres la fin de la relation.
          </li>
          <li>
            <strong>Historique des conversations WhatsApp</strong> : conserve
            pendant 6 mois maximum a des fins d&apos;amelioration du service.
          </li>
          <li>
            <strong>Logs techniques</strong> : conserves pendant 12 mois
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
          Le site EasyVacataire peut utiliser des cookies strictement necessaires
          au fonctionnement du service, notamment :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Cookies de session</strong> — pour maintenir
            l&apos;authentification des utilisateurs connectes
          </li>
          <li>
            <strong>Cookies techniques</strong> — pour assurer le bon
            fonctionnement de la plateforme
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-600">
          Aucun cookie publicitaire ou de suivi marketing n&apos;est utilise sur
          la plateforme.
        </p>
      </section>

      {/* 9 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          9. Droits des utilisateurs
        </h2>
        <p className="mb-3 leading-relaxed text-zinc-600">
          Conformement au RGPD, vous disposez des droits suivants concernant vos
          donnees personnelles :
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-600">
          <li>
            <strong>Droit d&apos;acces</strong> — obtenir la confirmation que
            des donnees vous concernant sont traitees et en recevoir une copie
          </li>
          <li>
            <strong>Droit de rectification</strong> — demander la correction de
            donnees inexactes ou incompletes
          </li>
          <li>
            <strong>Droit a l&apos;effacement</strong> — demander la suppression
            de vos donnees personnelles
          </li>
          <li>
            <strong>Droit a la portabilite</strong> — recevoir vos donnees dans
            un format structure et lisible par machine
          </li>
          <li>
            <strong>Droit d&apos;opposition</strong> — vous opposer au
            traitement de vos donnees pour des motifs legitimes
          </li>
          <li>
            <strong>Droit a la limitation du traitement</strong> — demander la
            suspension du traitement de vos donnees dans certains cas
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-zinc-600">
          Pour exercer l&apos;un de ces droits, vous pouvez nous contacter a
          l&apos;adresse suivante :{" "}
          <a
            href="mailto:contact@easyvacataire.fr"
            className="text-blue-600 underline"
          >
            contact@easyvacataire.fr
          </a>
          . Nous nous engageons a repondre a votre demande dans un delai de 30
          jours.
        </p>
      </section>

      {/* 10 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          10. Securite des donnees
        </h2>
        <p className="leading-relaxed text-zinc-600">
          EasyVacataire met en oeuvre des mesures techniques et
          organisationnelles appropriees pour proteger vos donnees personnelles
          contre tout acces non autorise, toute modification, divulgation ou
          destruction. Les communications sont chiffrees via HTTPS et
          l&apos;acces aux donnees est strictement limite aux personnes
          autorisees.
        </p>
      </section>

      {/* 11 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-zinc-800">
          11. Contact - Delegue a la protection des donnees
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Pour toute question relative a la protection de vos donnees
          personnelles ou pour exercer vos droits, vous pouvez contacter notre
          responsable de la protection des donnees :
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
          12. Reclamation aupres d&apos;une autorite de controle
        </h2>
        <p className="leading-relaxed text-zinc-600">
          Si vous estimez que le traitement de vos donnees personnelles
          constitue une violation du RGPD, vous avez le droit d&apos;introduire
          une reclamation aupres de la{" "}
          <strong>
            Commission Nationale de l&apos;Informatique et des Libertes (CNIL)
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
          13. Modifications de la politique de confidentialite
        </h2>
        <p className="leading-relaxed text-zinc-600">
          EasyVacataire se reserve le droit de modifier la presente politique de
          confidentialite a tout moment. En cas de modification substantielle,
          les utilisateurs en seront informes par les moyens de communication
          disponibles. La date de derniere mise a jour est indiquee en haut de
          cette page.
        </p>
      </section>
    </main>
  );
}

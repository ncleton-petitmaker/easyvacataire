import { jsPDF } from "jspdf";
import { getHeTD, getMontantBrut, PLAFOND_HETD } from "@/lib/hetd";

type CreneauPDF = {
  date: string;
  heure_debut: string;
  heure_fin: string;
  session_type: string;
  matieres: { name: string; code: string | null } | null;
};

type Params = {
  intervenant: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
  creneaux: CreneauPDF[];
  etablissement?: string;
  anneeUniversitaire?: string;
};

function parseHours(debut: string, fin: string): number {
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return (fh * 60 + fm - (dh * 60 + dm)) / 60;
}

export function generateEtatServiceFait(params: Params): Blob {
  const {
    intervenant,
    creneaux,
    etablissement = "Établissement",
    anneeUniversitaire,
  } = params;

  const now = new Date();
  const annee =
    anneeUniversitaire ||
    (now.getMonth() >= 8
      ? `${now.getFullYear()}/${now.getFullYear() + 1}`
      : `${now.getFullYear() - 1}/${now.getFullYear()}`);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // --- En-tête ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ETAT DE SERVICE FAIT", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${etablissement} - Annee universitaire ${annee}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 12;

  // --- Bloc vacataire ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Vacataire", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom : ${intervenant.last_name}`, margin, y);
  y += 5;
  doc.text(`Prenom : ${intervenant.first_name}`, margin, y);
  y += 5;
  if (intervenant.email) {
    doc.text(`Email : ${intervenant.email}`, margin, y);
    y += 5;
  }
  y += 5;

  // --- Tableau ---
  const sorted = [...creneaux].sort((a, b) =>
    a.date === b.date ? a.heure_debut.localeCompare(b.heure_debut) : a.date.localeCompare(b.date)
  );

  const colX = [margin, margin + 25, margin + 55, margin + 70, margin + 100, margin + 118, margin + 138];
  const headers = ["Date", "Horaire", "Type", "Matiere", "Heures", "HeTD", "Montant"];

  // Header row
  doc.setFillColor(66, 67, 196);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colX[i] + 1, y + 5);
  }
  y += 7;

  // Data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  let totalHeures = 0;
  let totalHeTD = 0;
  let totalMontant = 0;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const hours = parseHours(c.heure_debut, c.heure_fin);
    const type = c.session_type || "TD";
    const hetd = getHeTD(type, hours);
    const montant = getMontantBrut(type, hours);

    totalHeures += hours;
    totalHeTD += hetd;
    totalMontant += montant;

    // Alternate row bg
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");
    }

    const dateStr = c.date.split("-").reverse().join("/");
    doc.text(dateStr, colX[0] + 1, y + 4);
    doc.text(`${c.heure_debut}-${c.heure_fin}`, colX[1] + 1, y + 4);
    doc.text(type, colX[2] + 1, y + 4);
    doc.text((c.matieres?.code || c.matieres?.name || "-").substring(0, 18), colX[3] + 1, y + 4);
    doc.text(hours.toFixed(1), colX[4] + 1, y + 4);
    doc.text(hetd.toFixed(2), colX[5] + 1, y + 4);
    doc.text(`${montant.toFixed(2)} EUR`, colX[6] + 1, y + 4);

    y += 6;

    // Page break
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  }

  // Totaux
  y += 2;
  doc.setFillColor(66, 67, 196);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", colX[0] + 1, y + 5);
  doc.text(totalHeures.toFixed(1), colX[4] + 1, y + 5);
  doc.text(totalHeTD.toFixed(2), colX[5] + 1, y + 5);
  doc.text(`${totalMontant.toFixed(2)} EUR`, colX[6] + 1, y + 5);
  y += 12;

  doc.setTextColor(0, 0, 0);

  // Mention plafond
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Plafond reglementaire : ${PLAFOND_HETD} HeTD/an. Total cumule : ${totalHeTD.toFixed(2)} HeTD (${((totalHeTD / PLAFOND_HETD) * 100).toFixed(1)}%).`,
    margin,
    y
  );
  y += 12;

  // --- Bloc signature ---
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Fait a _______________________, le _______________________", margin, y);
  y += 15;

  doc.text("Signature du vacataire :", margin, y);
  doc.text("Signature du responsable :", pageWidth / 2 + 5, y);
  y += 25;

  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, margin + 60, y);
  doc.line(pageWidth / 2 + 5, y, pageWidth / 2 + 65, y);

  // --- Pied de page ---
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Document genere le ${now.toLocaleDateString("fr-FR")} - EasyVacataire`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc.output("blob");
}

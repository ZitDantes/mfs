/**
 * Sandy & Flav — RSVP → Google Sheet
 *
 * Setup :
 * 1. Créer un Google Sheet avec une feuille nommée "RSVP"
 * 2. Ligne 1 (en-têtes) :
 *    timestamp | parcours | evenement | nom | email | telephone |
 *    participation | enfants | nb_enfants | allergies | message
 *
 *    evenement: civil | religieux | combined
 *    participation (seul): oui | non
 *    participation (combined): les-deux | civil | religieux | aucun
 * 3. Extensions → Apps Script → coller ce fichier
 * 4. Remplacer SHEET_ID ci-dessous par l’ID du document
 *    (dans l’URL : https://docs.google.com/spreadsheets/d/SHEET_ID/edit)
 * 5. Déployer → Nouveau déploiement → Type : Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 6. Copier l’URL …/exec dans js/rsvp.js → constante GAS_URL
 */

var SHEET_ID = "REMPLACER_PAR_ID_DU_SHEET";
var SHEET_NAME = "RSVP";

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return json_({ ok: false, error: "Feuille RSVP introuvable." });
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.parcours || "",
      data.evenement || "",
      data.nom || "",
      data.email || "",
      data.telephone || "",
      data.participation || "",
      data.enfants || "",
      data.nb_enfants || "",
      data.allergies || "",
      data.message || "",
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "mfs-rsvp" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

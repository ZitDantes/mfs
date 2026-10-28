/**
 * Sandy & Flav — RSVP → Google Sheet
 *
 * IMPORTANT : créer ce script DEPUIS le Sheet
 * (ouvrir le Sheet → Extensions → Apps Script).
 * Ne pas utiliser SpreadsheetApp.openById() dans un projet isolé
 * si Google bloque l’OAuth « sensitive » Spreadsheet.
 *
 * Setup :
 * 1. Sheet avec une feuille nommée "RSVP"
 * 2. Ligne 1 (en-têtes) :
 *    timestamp | parcours | evenement | nom | email | telephone |
 *    participation | enfants | nb_enfants | allergies | message
 *
 *    evenement: civil | religieux | combined
 *    participation (seul): oui | non
 *    participation (combined): les-deux | civil | religieux | aucun
 *
 * 3. Extensions → Apps Script → coller ce fichier (projet lié au Sheet)
 * 4. Exécuter d’abord la fonction testSheet() pour autoriser l’accès
 * 5. Déployer → Nouveau déploiement → Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 6. Copier l’URL …/exec dans js/rsvp.js → constante GAS_URL
 */

var SHEET_NAME = "RSVP";

function getRsvpSheet_() {
  // Projet lié au classeur = pas besoin de SHEET_ID / openById
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Aucun classeur actif. Ouvre Apps Script depuis le Sheet (Extensions → Apps Script)."
    );
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Feuille "' + SHEET_NAME + '" introuvable.');
  }
  return sheet;
}

/** À exécuter une fois dans l’éditeur pour déclencher / valider les droits Sheet. */
function testSheet() {
  var sheet = getRsvpSheet_();
  Logger.log("OK — classeur : " + sheet.getParent().getName());
  Logger.log("OK — feuille : " + sheet.getName());
  Logger.log("OK — lignes : " + sheet.getLastRow());
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var sheet = getRsvpSheet_();

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
  try {
    getRsvpSheet_();
    return json_({ ok: true, service: "mfs-rsvp" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

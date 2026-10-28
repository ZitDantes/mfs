/**
 * Sandy & Flav — RSVP → Google Sheet
 *
 * Script lié au Sheet (Extensions → Apps Script depuis le classeur).
 *
 * 1. Coller ce code
 * 2. Exécuter testSheet() UNE FOIS (autorise + mémorise l’ID du Sheet)
 * 3. Déployer / mettre à jour l’Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 *    - Après chaque modif du code : Gérer les déploiements → crayon
 *      → Version = Nouvelle version → Déployer
 * 4. URL …/exec → js/rsvp.js (GAS_URL)
 *
 * En Web App, getActiveSpreadsheet() est souvent null : on utilise
 * donc l’ID enregistré par testSheet() + openById().
 */

var SHEET_NAME = "RSVP";
var PROP_SHEET_ID = "SHEET_ID";

function getRsvpSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    var id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
    if (!id) {
      throw new Error(
        "Sheet non lié. Exécute testSheet() une fois dans l’éditeur Apps Script."
      );
    }
    ss = SpreadsheetApp.openById(id);
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Feuille "' + SHEET_NAME + '" introuvable.');
  }
  return sheet;
}

/** À exécuter une fois : droits + mémorisation de l’ID pour la Web App. */
function testSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Ouvre Apps Script depuis le Sheet (Extensions → Apps Script), pas un projet isolé."
    );
  }

  PropertiesService.getScriptProperties().setProperty(PROP_SHEET_ID, ss.getId());

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Feuille "' + SHEET_NAME + '" introuvable.');
  }

  Logger.log("OK — classeur : " + ss.getName() + " (" + ss.getId() + ")");
  Logger.log("OK — feuille : " + sheet.getName());
  Logger.log("OK — lignes : " + sheet.getLastRow());
  Logger.log("ID mémorisé pour la Web App. Mets à jour le déploiement (nouvelle version).");
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
    var sheet = getRsvpSheet_();
    return json_({
      ok: true,
      service: "mfs-rsvp",
      sheet: sheet.getName(),
      rows: sheet.getLastRow(),
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

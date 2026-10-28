# Sandy & Flav — site mariage (mfs)

Site statique HTML/CSS/JS, hébergé sur GitHub Pages. Trois parcours d’invitation cloisonnés, RSVP vers Google Sheet via Apps Script.

## Liens d’invitation

Remplacer la base si besoin (`https://zitdantes.github.io/mfs`).

| Parcours | Code | Lien |
|----------|------|------|
| Civil seul | `epinay` | https://zitdantes.github.io/mfs/?i=epinay |
| Religieux seul | `brosse` | https://zitdantes.github.io/mfs/?i=brosse |
| Les deux | `20ans` | https://zitdantes.github.io/mfs/?i=20ans |

Sans code valide, le site demande le code et ne liste aucun événement.

## Activer GitHub Pages

1. Repo Settings → Pages
2. Source : Deploy from a branch
3. Branch : `main` / root (`/`)
4. Enregistrer, attendre 1–2 minutes

## Brancher le RSVP (Google Sheet + Apps Script)

1. Créer un Google Sheet, feuille nommée `RSVP`
2. En-têtes ligne 1 :

   `timestamp | parcours | evenement | nom | email | telephone | participation | enfants | nb_enfants | allergies | message`

3. Extensions → Apps Script → coller [`gas/Code.gs`](gas/Code.gs)
4. Remplacer `SHEET_ID` par l’ID du document
5. Déployer → Nouveau déploiement → **Application Web**
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
6. Copier l’URL `…/exec` dans [`js/rsvp.js`](js/rsvp.js) → constante `GAS_URL`
7. Commit + push

Extracts : filtrer le Sheet par `evenement` (`civil` / `religieux`) ou `parcours` (`epinay` / `brosse` / `20ans`), puis Fichier → Télécharger → CSV.

## Structure

```
index.html      Accueil
civil.html      5 juin 2027 + RSVP
religieux.html  17–18 juillet 2027 + RSVP
infos.html      Accès / repas / hébergements (filtrés)
css/styles.css
js/invite.js
js/rsvp.js
gas/Code.gs
assets/
```

## Dev local

Ouvrir les fichiers via un serveur statique (recommandé) :

```bash
python3 -m http.server 8080
```

Puis http://localhost:8080/?i=20ans

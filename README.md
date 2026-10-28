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

> Si Google affiche **This app is blocked** : c’est souvent le scope Spreadsheet
> (`openById` / projet isolé). Utilise un **script lié au Sheet** (ci-dessous).

1. Ouvre ton Google Sheet RSVP (feuille nommée `RSVP`)
2. En-têtes ligne 1 :

   `timestamp | parcours | evenement | nom | email | telephone | participation | enfants | nb_enfants | allergies | message`

3. **Extensions → Apps Script** (depuis ce Sheet, pas un projet vide à part)
4. Colle [`gas/Code.gs`](gas/Code.gs)
5. Exécute d’abord `testSheet` → accepte les permissions Sheet
6. Déployer → Nouveau déploiement → **Application Web**
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
7. Copier l’URL `…/exec` dans [`js/rsvp.js`](js/rsvp.js) → constante `GAS_URL`
8. Commit + push

Extracts : filtrer le Sheet puis Fichier → Télécharger → CSV.

- Invité civil seul : `evenement=civil`, `participation=oui|non`
- Invité religieux seul : `evenement=religieux`, `participation=oui|non`
- Invité aux deux : `evenement=combined`, `participation=les-deux|civil|religieux|aucun`

Liste civil ≈ `participation` in (`oui`, `civil`, `les-deux`) selon le parcours.  
Liste religieux ≈ `participation` in (`oui`, `religieux`, `les-deux`).

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

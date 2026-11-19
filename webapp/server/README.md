# kclick · API (Express)

API des commandes et des 4 dashboards (client, employé, livreur, super-admin).
Base de données : PostgreSQL chez Supabase (schéma dans `../supabase/migrations`).
Connexion des utilisateurs : Supabase Auth (le front envoie le jeton, l'API le vérifie).

## Lancer en local

```bash
cd webapp/server
cp .env.example .env      # puis remplir DATABASE_URL et SUPABASE_URL
npm install
npm run dev               # redémarre tout seul à chaque modification
npm test                  # base PostgreSQL en mémoire avec les migrations : ne touche jamais Supabase
```

- `GET http://localhost:4000/health` doit répondre `{ "ok": true }`.
- `GET http://localhost:4000/api/v1/catalog/products?brand=patchi` liste les produits Patchi.

## Organisation

```
src/
├── server.js            démarre le serveur, arrêt propre
├── app.js               middlewares + routes
├── routes.js            chaque module monté sous /api/v1
├── config/              env (vérifié au démarrage), db (pg + transactions), logger
├── middlewares/         auth, requireRole, validate, requestId, rateLimit, errorHandler
├── shared/              errors (codes lisibles), events (bus interne), money
└── modules/<domaine>/   un dossier par domaine, toujours les mêmes fichiers :
      <domaine>.routes.js       URL → contrôleur, rôle requis
      <domaine>.controller.js   lit la requête, renvoie la réponse
      <domaine>.service.js      règles métier
      <domaine>.model.js        SQL uniquement
      <domaine>.schemas.js      format des données attendues (Zod)
```

| Module | Rôle | État |
|---|---|---|
| catalog | `GET /catalog/brands` (brands + rayons), `GET /catalog/products` (filtres brand, category, tag, search, inStock, tri), `GET /catalog/products/:slug` (fiche + produits liés) | prêt |
| orders | `POST /orders` (checkout avec ou sans compte), `GET /orders/mine?tab=`, `GET /orders/:id` (selon le rôle), `POST /orders/:id/cancel` ; `orders.status.js` = machine à statuts | prêt |
| parts | travail de chaque brand : accepter, préparer, refuser | à écrire |
| deliveries | livreur : attribution, collecte, remise, cash | à écrire |
| payments | `GET /payments?status=&kind=`, `POST /payments/:id/confirm` (paiement reçu, référence obligatoire), `POST /payments/:id/fail`, `GET /payments/refunds`, `POST /payments/refunds/:id/done` (super-admin) ; `POST /payments/webhooks/:provider` prêt à brancher ; mobile money et carte uniquement | prêt (sans prestataire) |
| notifications | `channels/` app, WhatsApp, SMS | canal app prêt |
| auth | `POST /auth/staff/check` (cet e-mail peut-il entrer dans l'espace équipe ?), `GET /auth/me` (profil, rôles, page d'arrivée) | prêt |
| users | `GET/PATCH /users/me` ; super admin : `GET /users?role=&status=&search=`, `POST /users/invitations`, `GET/PATCH /users/:id`, `POST /users/:id/deactivate` et `/reactivate`, `DELETE /users/invitations/:id`, `POST /users/invitations/:id/resend` (e-mail à brancher) | prêt |
| clients | super admin : `GET /clients?search=&filter=all\|account\|guest`, `GET /clients/:key` (commandes, adresses) | prêt |
| settings | super admin : `GET /settings`, `PUT /settings/:section` (general, delivery, payments, notifications, security) ; public : `GET /settings/public` (zones de livraison, contacts, moyens de paiement) | prêt |
| brands | `GET /brands`, `GET /brands/:slug` (public) ; `PATCH /brands/:slug` (ouverture « bientôt disponible », point de retrait — super admin) ; `GET/PUT /brands/:slug/hours` (super admin ou employé de la Maison) | prêt |
| dashboards | données des 4 dashboards | à écrire |

Une route pas encore écrite répond `501 NOT_IMPLEMENTED`.

## Connexion (Supabase Auth, code à 6 chiffres par e-mail)

Tout le monde se connecte avec un code reçu par e-mail, sans mot de passe. Le front utilise `supabase-js`
(`signInWithOtp` puis `verifyOtp`) et envoie ensuite le jeton à l'API, qui le vérifie (`middlewares/auth.js`).

- Équipe : le super admin invite la personne (`POST /users/invitations`). À sa première connexion, la base lui donne
  son rôle (trigger `handle_new_user`). Avant d'envoyer le code, la page de connexion de l'équipe appelle
  `POST /auth/staff/check`. Un compte désactivé reçoit `403 ACCOUNT_DISABLED`.
- Super admin de départ : `ecommerce@kennysinternational.com` (invitation créée par la migration).

À régler une fois dans Supabase (Authentication) :
1. Providers › Email : activé, « Confirm email » activé.
2. Email Templates › **Magic Link** : afficher le code au lieu du lien, par exemple
   `<p>Votre code de connexion kclick : <strong>{{ .Token }}</strong> (valable 10 minutes)</p>`.
   Faire de même pour **Confirm signup** (première connexion).
3. Settings : longueur du code (OTP) **6**, expiration **600 s**.
4. URL Configuration : Site URL = adresse du site (Netlify), et ajouter `http://localhost:5173` aux Redirect URLs.
5. Plus tard : SMTP personnalisé (service d'e-mails) — l'envoi par défaut de Supabase est limité à quelques e-mails par heure.

## Photos (Supabase Storage)

Un bucket public par Maison (`kyra`, `patchi`, `adidas`, `celio`). Ranger les photos dans
`webapp/supabase/images/<maison>/<CODE>/` (voir le README de ce dossier), ajouter `SUPABASE_SERVICE_ROLE_KEY`
dans `.env`, puis :

```bash
npm run images:upload -- --dry-run    # vérifier
npm run images:upload                 # envoyer et lier les photos aux produits
npm run images:upload -- --from-site  # envoyer aussi les photos actuelles du site (/img/…)
```

## Ajouter une fonctionnalité

1. Créer `src/modules/<nom>/` avec les 5 fichiers (copier `catalog/`).
2. Monter le module dans `src/routes.js`.
3. Si d'autres modules doivent réagir, émettre un événement (`events.emit('…')`) au lieu de les appeler directement.

## Déboguer

- Chaque réponse a un en-tête `x-request-id` ; chercher cet identifiant dans les journaux (Railway / Render › Logs).
- Toute erreur renvoie `{ error: { code, message, details, requestId } }`. Les codes sont lisibles : `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`…
- `LOG_LEVEL=debug` affiche aussi les événements internes.

## Déployer (Railway ou Render)

- Dossier racine du service : `webapp/server`
- Build : `npm install` · Démarrage : `npm start` · Vérification de santé : `/health`
- Variables : celles de `.env.example` (`NODE_ENV=production`). `PORT` est fourni par la plateforme.

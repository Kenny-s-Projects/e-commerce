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
| payments | paiement « en attente » à la commande, remboursement à l'annulation ; `providers/` mobile money et carte | base prête, routes à écrire |
| notifications | `channels/` app, WhatsApp, SMS | canal app prêt |
| users | profil, rôles (super-admin) | à écrire |
| brands | horaires, point de retrait | à écrire |
| dashboards | données des 4 dashboards | à écrire |

Une route pas encore écrite répond `501 NOT_IMPLEMENTED`.

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

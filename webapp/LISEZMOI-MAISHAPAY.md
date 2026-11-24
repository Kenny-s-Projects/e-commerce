# Paiements MaishaPay — kclick

Intégration du paiement en ligne (mobile money et carte) avec MaishaPay, en dollars.
Les fichiers de ce zip gardent leur chemin dans le dépôt (`webapp/...`). Base : branche `finalMVP` (commit bebc608).

## Règles retenues
- **Frais** : à la charge du client (MaishaPay les ajoute au montant débité ; ils sont enregistrés dans `payments.fees`).
- **Maisons** : une commande n'arrive chez la Maison (file, préparation) **qu'une fois payée**. L'e-mail « nouvelle commande » à l'équipe part au paiement (paiement en ligne) ; si le paiement en ligne n'est pas activé, il part à la commande comme avant.
- **Carte** : activée (page de paiement sécurisée CyberSource de Visa ; aucun numéro de carte ne passe par kclick).
- **M-Pesa** : envoyé à MaishaPay avec le code `MPESA` (à vérifier avec les clés de test).
- **Devise** : USD uniquement.

## Sécurité
- Les messages de MaishaPay ne sont pas signés : **ils ne suffisent jamais** à marquer un paiement payé.
  Chaque résultat est revérifié auprès de MaishaPay (`/transaction/rest/v2/check`) avant d'être compté.
- Les clés ne sont jamais dans le code, ni dans la base, ni dans les journaux (le journal `payment_events` les retire).
- Payé après l'annulation d'une commande, ou payé deux fois : le paiement est enregistré et un remboursement est créé pour l'équipe.

## Fichiers

### Serveur — `webapp/server/src/modules/payments/`
| Fichier | Rôle |
|---|---|
| `providers/maishapay.js` *(nouveau)* | Tous les appels à MaishaPay : mobile money v2, carte v3, vérification, codes opérateurs, format des numéros, statuts. |
| `providers/mobileMoney.js` | Mobile money branché sur MaishaPay. |
| `providers/card.js` | Carte branchée sur MaishaPay (page de paiement sécurisée). |
| `providers/index.js` | Interface commune des moyens de paiement. |
| `payments.routes.js` | `POST /payments/start`, `GET /payments/status/:number`, messages MaishaPay (`POST` et `GET /payments/webhooks/maishapay`), routes super-admin. |
| `payments.service.js` | Lancer / relancer, vérifier, régler (payé / échoué), expiration après 10 min, revérification toutes les minutes, trop-perçu → remboursement. |
| `payments.model.js`, `payments.controller.js`, `payments.schemas.js` | Accès base, contrôleurs, validation. |

### Serveur — autres
| Fichier | Rôle |
|---|---|
| `src/config/env.js`, `.env.example` | Nouvelles variables (voir plus bas). |
| `src/server.js` | Démarre la revérification des paiements toutes les minutes. |
| `src/middlewares/rateLimit.js` | Limite pour le lancement des paiements (10 / minute). |
| `src/modules/orders/orders.model.js`, `src/modules/parts/parts.service.js` | Les Maisons ne voient et ne préparent que les commandes payées. |
| `src/modules/notifications/notifications.subscribers.js` | « Nouvelle commande » à l'équipe au moment du paiement. |

### Site — `webapp/client/src/`
| Fichier | Rôle |
|---|---|
| `lib/payment.js` *(nouveau)* | Appels au serveur : lancer, suivre, page carte. |
| `components/PaymentStatus/PaymentStatus.jsx` *(nouveau)* | « Validez sur votre téléphone » + compte à rebours, payé, échec + « Réessayer » (autre opérateur / numéro), carte. |
| `pages/Checkout/CheckoutPage.jsx` | Lance le paiement après la commande ; carte → page sécurisée ; mention des frais. |
| `pages/Suivi/TrackingPage.jsx` | État du paiement en direct (retour du paiement par carte, réessayer). |
| `i18n/en/live.js` | Textes en anglais. |

### Dashboard — `webapp/client/src/dashboard/`
| Fichier | Rôle |
|---|---|
| `admin/Payments.jsx` *(nouveau)* | Paiements : statut kclick, **statut MaishaPay**, **référence** et **n° de transaction MaishaPay**, frais, motif d'échec ; filtres et recherche. |
| `DashboardApp.jsx` | Rubrique « Paiements » du menu (au lieu de « bientôt »). |
| `i18n/en/dashboard.js` | Textes en anglais. |

### Base — `webapp/supabase/migrations/20261124100000_maishapay.sql` *(nouveau)*
- Table **`payments`** : `reference`, `provider_tx_id`, `fees`, `failure_reason`, `payment_page`, `started_at`, `expires_at`, `checked_at`.
- Table **`payment_events`** *(nouvelle)* : journal de chaque paiement (demande, réponse, notification, vérification, expiration, erreur), sans les clés. Accès réservé à l'API.

### Tests — `webapp/server/tests/integration/`
- `maishapay.test.js` *(nouveau)* : 10 tests avec un **faux MaishaPay** (aucun appel réel) : demande envoyée et jamais en double, faux message refusé, paiement confirmé (e-mails une seule fois), échec puis nouvel essai avec un autre opérateur, MaishaPay injoignable, délai dépassé, carte, téléphone obligatoire, payé après annulation → remboursement, liste du dashboard.
- `payments.test.js`, `flow.test.js`, `emails.test.js` : adaptés (une commande se paie avant d'être préparée).
- Résultat : **67 tests sur 67** passent.

## Mise en place
1. Appliquer le patch (ou copier les fichiers) sur `finalMVP` : `git apply maishapay.patch`
2. Appliquer la migration sur Supabase : `webapp/supabase/migrations/20261124100000_maishapay.sql`
3. Variables (Railway et `webapp/server/.env`, **jamais dans Git**) :
   ```
   MAISHAPAY_PUBLIC_KEY=MP-SBPK-…
   MAISHAPAY_SECRET_KEY=MP-SBSK-…
   MAISHAPAY_MODE=0
   API_PUBLIC_URL=https://e-commerce-production-46b752b9.up.railway.app
   PAYMENT_TIMEOUT_MINUTES=10
   ```
   Sans les deux clés, rien ne change : les paiements restent confirmés à la main dans le dashboard.
4. Tester avec les clés de test (`MAISHAPAY_MODE=0`) sur un vrai téléphone, puis passer aux clés réelles (`MP-LIVE…`, `MAISHAPAY_MODE=1`).

## À vérifier avec les clés de test
- M-Pesa accepté en version 2 (`provider: MPESA`) ?
- Le message de résultat mobile money arrive bien en JSON (le formulaire est aussi accepté).
- Le retour de la carte (GET sur `/api/v1/payments/webhooks/maishapay`) ramène bien le client sur `#suivi/KC-…`.
- Frais : le client est bien débité de « montant + frais ».

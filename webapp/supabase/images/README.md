# Photos produits

Les photos sont rangées ici par Maison puis par code produit, puis envoyées dans Supabase Storage
(un bucket public par Maison : `kyra`, `patchi`, `adidas`, `celio`).

```
webapp/supabase/images/
├── patchi/
│   ├── GSB0010/
│   │   ├── 1.jpg        ← photo principale (la première par ordre alphabétique)
│   │   ├── 2.jpg
│   │   └── 3.jpg
│   └── CCD03/
│       └── 1.webp
├── kyra/
├── adidas/
└── celio/
```

- Nom du dossier : le **code produit** de l’ERP (`GSB0010`, `CCD03`…). Pour Kyra, adidas et Celio (pas encore de code ERP), le nom court du produit sur le site (ex. `chanel-n5-deodorant`).
- Formats : JPG, PNG, WEBP ou AVIF, **5 Mo maximum** par photo.
- Conseillé : au moins **1600 px** de large, produit centré, fond clair et uni, même cadrage pour tous les produits d’une Maison.
- 1 photo minimum par produit ; 3 à 4 idéalement (face, ouverte, détail, emballage cadeau).

## Envoyer les photos

Dans `webapp/server/.env`, ajouter la clé `SUPABASE_SERVICE_ROLE_KEY` (Supabase › Project Settings › API keys).
Elle donne tous les droits sur le projet : ne jamais la commiter ni la mettre dans le front.

```bash
cd webapp/server
npm run images:upload -- --dry-run     # vérifier sans rien envoyer
npm run images:upload                  # envoyer et mettre à jour les fiches produit
npm run images:upload -- --from-site   # envoyer aussi les photos actuelles du site (Kyra, adidas, Celio)
```

Chaque photo est envoyée à `products/<CODE>/<n>.<ext>` dans le bucket de la Maison. Les photos d’un produit
remplacent les précédentes. Le script liste les dossiers dont le code ne correspond à aucun produit.

Ce dossier ne contient que des photos à envoyer : on peut le vider une fois l’envoi fait (les photos restent dans Storage).

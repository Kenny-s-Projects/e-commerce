# kclick

Site e-commerce kclick, par Kenny's International : Kyra, Patchi, adidas et Celio.

Site statique : aucune installation ni compilation. Il suffit de servir le dossier.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique, styles du site Kenny's |
| `app.js` | Application React (accueil, Kyra, panier, contact) |
| `brands.js` | Pages des marques (Patchi, adidas, Celio), produits Patchi, page contact, navigation |
| `brands.css` | Styles propres à chaque marque |
| `img/` | Photos produits Kyra et emblème |
| `img/logos/` | Logos des marques et visuel provisoire Patchi |

## Pages

`#kyra`, `#patchi`, `#adidas`, `#celio`, `#contact` (la page contact n'est liée que depuis le pied de page).

## Ajouter des produits

Dans `brands.js`, ajouter des objets au tableau `products` de la marque :

```js
{ id: "ref-unique", ref: "REF", cat: "id-categorie", name: "Nom", price: 45, unit: null, stock: 6, img: "img/patchi/ref.webp" }
```

`unit: "kg"` pour les produits au poids. Sans `img`, le visuel provisoire de la marque s'affiche.

## Lancer en local

```bash
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## Mise en ligne

Netlify (ou tout hébergeur statique) : dossier de publication `/`, pas de commande de build.

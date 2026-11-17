// Catalogue complet des Maisons (pages Maison).
// Kyra : 29 produits repris de l’existant (app.js). Patchi : 18 produits de l’ERP Product Master (oct. 2026).

const PATCHI_IMG = '/img/logos/patchi-placeholder.png' // visuel provisoire

export const kyraCatalog = [
  {
    "id": "chanel-n5-deodorant",
    "brand": "chanel",
    "store": "Chanel",
    "cls": "perfume",
    "name": "N°5 The Deodorant",
    "desc": "Déodorant vaporisateur, 100 ml",
    "price": 93,
    "img": "/img/chanel-n5-deodorant.webp"
  },
  {
    "id": "chanel-chance-eau-tendre",
    "brand": "chanel",
    "store": "Chanel",
    "cls": "perfume",
    "name": "Chance Eau Tendre",
    "desc": "Voile hydratant pour le corps, 100 ml",
    "price": 100,
    "img": "/img/chanel-chance-eau-tendre.webp"
  },
  {
    "id": "dior-miss-dior-parfum",
    "brand": "dior",
    "store": "Dior",
    "cls": "perfume",
    "name": "Miss Dior Parfum",
    "desc": "Roller-perle, 20 ml",
    "price": 78,
    "img": "/img/dior-miss-dior-parfum.webp"
  },
  {
    "id": "dior-forever-hydra-nude",
    "brand": "dior",
    "store": "Dior",
    "cls": "makeup",
    "name": "Forever Hydra Nude",
    "desc": "Fond de teint fluide, teinte 6N",
    "price": 78,
    "img": "/img/dior-forever-hydra-nude.webp"
  },
  {
    "id": "dior-rouge-blush",
    "brand": "dior",
    "store": "Dior",
    "cls": "makeup",
    "name": "Rouge Blush Colour & Glow",
    "desc": "Duo blush et illuminateur, teinte 457 Diorette",
    "price": 78,
    "img": "/img/dior-rouge-blush.webp"
  },
  {
    "id": "dior-hydra-life",
    "brand": "dior",
    "store": "Dior",
    "cls": "skincare",
    "name": "Hydra Life",
    "desc": "Essence sorbet hydratation intense, 40 ml",
    "price": 97,
    "img": "/img/dior-hydra-life.webp"
  },
  {
    "id": "hermes-eau-des-merveilles",
    "brand": "hermes",
    "store": "Hermès",
    "cls": "perfume",
    "name": "Eau des Merveilles",
    "desc": "Eau de toilette, 50 ml",
    "price": 93,
    "img": "/img/hermes-eau-des-merveilles.webp"
  },
  {
    "id": "hermes-terre-deo",
    "brand": "hermes",
    "store": "Hermès",
    "cls": "perfume",
    "name": "Terre d’Hermès",
    "desc": "Déodorant vaporisateur, 150 ml",
    "price": 63,
    "img": "/img/hermes-terre-deo.webp"
  },
  {
    "id": "hermes-twilly-eau-ginger",
    "brand": "hermes",
    "store": "Hermès",
    "cls": "perfume",
    "name": "Twilly Eau Ginger",
    "desc": "Eau de parfum, 50 ml",
    "price": 96,
    "img": "/img/hermes-twilly-eau-ginger.webp"
  },
  {
    "id": "hermes-orange-verte-deo",
    "brand": "hermes",
    "store": "Hermès",
    "cls": "perfume",
    "name": "Eau d’Orange Verte",
    "desc": "Déodorant vaporisateur, 150 ml",
    "price": 52,
    "img": "/img/hermes-orange-verte-deo.webp"
  },
  {
    "id": "tomford-black-orchid",
    "brand": "tomford",
    "store": "Tom Ford",
    "cls": "perfume",
    "name": "Black Orchid",
    "desc": "Brume pour le corps, 150 ml",
    "price": 74,
    "img": "/img/tomford-black-orchid.webp"
  },
  {
    "id": "tomford-for-men-100",
    "brand": "tomford",
    "store": "Tom Ford",
    "cls": "perfume",
    "name": "Tom Ford for Men",
    "desc": "Eau de toilette vaporisateur, 100 ml",
    "price": 98,
    "img": "/img/tomford-for-men-100.webp"
  },
  {
    "id": "tomford-for-men-50",
    "brand": "tomford",
    "store": "Tom Ford",
    "cls": "perfume",
    "name": "Tom Ford for Men",
    "desc": "Eau de toilette vaporisateur, 50 ml",
    "price": 71,
    "img": "/img/tomford-for-men-50.webp"
  },
  {
    "id": "blackup-nairobi",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "perfume",
    "name": "Nairobi",
    "desc": "Eau de parfum, collection blackUp Parfums",
    "price": 94,
    "img": "/img/blackup-nairobi.webp"
  },
  {
    "id": "blackup-reve-de-namibie",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "perfume",
    "name": "Rêve de Namibie",
    "desc": "Eau de parfum, collection blackUp Parfums",
    "price": 94,
    "img": "/img/blackup-reve-de-namibie.webp"
  },
  {
    "id": "blackup-rose-des-sables",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "perfume",
    "name": "Rose des Sables",
    "desc": "Eau de parfum, collection blackUp Parfums",
    "price": 94,
    "img": "/img/blackup-rose-des-sables.webp"
  },
  {
    "id": "blackup-fdt-creme-poudre",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "makeup",
    "name": "Fond de Teint Crème Poudré",
    "desc": "Fond de teint crème-poudre, teinte 03, 30 ml",
    "price": 53,
    "img": "/img/blackup-fdt-creme-poudre.webp"
  },
  {
    "id": "blackup-haute-couvrance",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "makeup",
    "name": "Crème Haute Couvrance",
    "desc": "Fond de teint crème haute couvrance, teinte 06, 30 ml",
    "price": 49,
    "img": "/img/blackup-haute-couvrance.webp"
  },
  {
    "id": "blackup-two-way-cake",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "makeup",
    "name": "Two Way Cake",
    "desc": "Fond de teint poudre compacte, teinte 14, 11 g",
    "price": 49,
    "img": "/img/blackup-two-way-cake.webp"
  },
  {
    "id": "blackup-cc-cream",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "skincare",
    "name": "CC Cream Multi-Action",
    "desc": "Crème correctrice de teint, teinte 05, 30 ml",
    "price": 46,
    "img": "/img/blackup-cc-cream.webp"
  },
  {
    "id": "blackup-coil-me-up",
    "brand": "blackup",
    "store": "blackUp",
    "cls": "skincare",
    "name": "Coil Me Up",
    "desc": "Définisseur de boucles, 200 ml",
    "price": 33,
    "img": "/img/blackup-coil-me-up.webp"
  },
  {
    "id": "ck-euphoria-bold",
    "brand": "calvinklein",
    "store": "Calvin Klein",
    "cls": "perfume",
    "name": "Euphoria Bold Elixir",
    "desc": "Eau de parfum, 50 ml",
    "price": 96,
    "img": "/img/ck-euphoria-bold.webp"
  },
  {
    "id": "ck-euphoria-magnetic",
    "brand": "calvinklein",
    "store": "Calvin Klein",
    "cls": "perfume",
    "name": "Euphoria Magnetic Elixir",
    "desc": "Eau de parfum, 50 ml",
    "price": 96,
    "img": "/img/ck-euphoria-magnetic.webp"
  },
  {
    "id": "ck-euphoria-solar",
    "brand": "calvinklein",
    "store": "Calvin Klein",
    "cls": "perfume",
    "name": "Euphoria Solar Elixir",
    "desc": "Eau de parfum, 50 ml",
    "price": 96,
    "img": "/img/ck-euphoria-solar.webp"
  },
  {
    "id": "ck-defy-parfum",
    "brand": "calvinklein",
    "store": "Calvin Klein",
    "cls": "perfume",
    "name": "Defy Parfum",
    "desc": "Parfum, 50 ml",
    "price": 92,
    "img": "/img/ck-defy-parfum.webp"
  },
  {
    "id": "versace-dylan-purple",
    "brand": "versace",
    "store": "Versace",
    "cls": "perfume",
    "name": "Dylan Purple",
    "desc": "Eau de parfum, 30 ml",
    "price": 101,
    "img": "/img/versace-dylan-purple.webp"
  },
  {
    "id": "versace-dylan-blue",
    "brand": "versace",
    "store": "Versace",
    "cls": "perfume",
    "name": "Dylan Blue Pour Femme",
    "desc": "Eau de parfum, 30 ml",
    "price": 97,
    "img": "/img/versace-dylan-blue.webp"
  },
  {
    "id": "versace-the-dreamer",
    "brand": "versace",
    "store": "Versace",
    "cls": "perfume",
    "name": "The Dreamer",
    "desc": "Eau de toilette, 50 ml",
    "price": 94,
    "img": "/img/versace-the-dreamer.webp"
  },
  {
    "id": "versace-dylan-turquoise",
    "brand": "versace",
    "store": "Versace",
    "cls": "perfume",
    "name": "Dylan Turquoise",
    "desc": "Eau de toilette, 30 ml",
    "price": 89,
    "img": "/img/versace-dylan-turquoise.webp"
  }
]

export const patchiCatalog = [
  {
    "id": "ccd01",
    "ref": "CCD01",
    "cat": "deluxe",
    "store": "Deluxe",
    "name": "Chocolate Milk Filled with Praline",
    "price": 96,
    "unit": "kg",
    "stock": 5,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ccd03",
    "ref": "CCD03",
    "cat": "deluxe",
    "store": "Deluxe",
    "name": "Capricio Chocolate",
    "price": 96,
    "unit": "kg",
    "stock": 10,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ccd04",
    "ref": "CCD04",
    "cat": "deluxe",
    "store": "Deluxe",
    "name": "Chocolate Wafer Milk Square",
    "price": 96,
    "unit": "kg",
    "stock": 16,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ccn01",
    "ref": "CCN01",
    "cat": "classic",
    "store": "Classiques",
    "name": "Finesse Chocolate",
    "price": 96,
    "unit": "kg",
    "stock": 10,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ccn02",
    "ref": "CCN02",
    "cat": "classic",
    "store": "Classiques",
    "name": "Noblesse Chocolate",
    "price": 96,
    "unit": "kg",
    "stock": 10,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ccn03",
    "ref": "CCN03",
    "cat": "classic",
    "store": "Classiques",
    "name": "Audace Chocolate",
    "price": 96,
    "unit": "kg",
    "stock": 10,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ggf0004",
    "ref": "GGF0004",
    "cat": "giftboxes",
    "store": "Coffrets",
    "name": "Filled Chocolate Box 780 g",
    "price": 126,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ggf0005",
    "ref": "GGF0005",
    "cat": "giftboxes",
    "store": "Coffrets",
    "name": "Filled Chocolate Box 1025 g",
    "price": 163,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "ggf0006",
    "ref": "GGF0006",
    "cat": "giftboxes",
    "store": "Coffrets",
    "name": "Filled Chocolate Box 785 g",
    "price": 126,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gns0009",
    "ref": "GNS0009",
    "cat": "smallboxes",
    "store": "Petites boîtes",
    "name": "Filled Chocolate Box 225 g, No Added Sugar",
    "price": 41,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gns0010",
    "ref": "GNS0010",
    "cat": "smallboxes",
    "store": "Petites boîtes",
    "name": "Filled Chocolate Box 225 g, No Added Sugar",
    "price": 41,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gsb0003",
    "ref": "GSB0003",
    "cat": "smallboxes",
    "store": "Petites boîtes",
    "name": "Green Filled Chocolate Box 195 g",
    "price": 39,
    "unit": null,
    "stock": 6,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gns0013",
    "ref": "GNS0013",
    "cat": "mytreat",
    "store": "My Treat",
    "name": "Dragée Diet Almond Milk, Bag 250 g",
    "price": 45,
    "unit": null,
    "stock": 3,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gns0014",
    "ref": "GNS0014",
    "cat": "mytreat",
    "store": "My Treat",
    "name": "Dragée Diet Bitter, Bag 250 g",
    "price": 45,
    "unit": null,
    "stock": 3,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gns0015",
    "ref": "GNS0015",
    "cat": "mytreat",
    "store": "My Treat",
    "name": "Dragée Diet Milk Hazelnut, Bag 250 g",
    "price": 45,
    "unit": null,
    "stock": 3,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gbr0001",
    "ref": "GBR0001",
    "cat": "bars",
    "store": "Tablettes",
    "name": "Chocolate Bar 100 g Finesse",
    "price": 15,
    "unit": null,
    "stock": 3,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gbr0002",
    "ref": "GBR0002",
    "cat": "bars",
    "store": "Tablettes",
    "name": "Chocolate Bar 100 g Noblesse 70%",
    "price": 15,
    "unit": null,
    "stock": 2,
    "img": PATCHI_IMG,
    "boxed": true
  },
  {
    "id": "gbr0003",
    "ref": "GBR0003",
    "cat": "bars",
    "store": "Tablettes",
    "name": "Chocolate Bar 100 g Audace",
    "price": 15,
    "unit": null,
    "stock": 2,
    "img": PATCHI_IMG,
    "boxed": true
  }
]

// ⚠️ adidas et Celio : catalogues FANTÔMES pour le prototype (noms de modèles, sans prix ni photos).
// À remplacer par le vrai catalogue avant la mise en ligne. price: null → « [Prix] », ajout au panier désactivé.

// who : homme / femme / enfant · cat : chaussures / vetements / accessoires
export const adidasCatalog = [
  { id: 'adidas-samba-og', who: 'homme', cat: 'chaussures', store: 'Homme · Chaussures', name: 'Samba OG', tag: 'Icône', price: null },
  { id: 'adidas-stan-smith', who: 'homme', cat: 'chaussures', store: 'Homme · Chaussures', name: 'Stan Smith', tag: 'Icône', price: null },
  { id: 'adidas-survetement-adicolor', who: 'homme', cat: 'vetements', store: 'Homme · Vêtements', name: 'Survêtement Adicolor', tag: 'Nouveau', price: null },
  { id: 'adidas-pantalon-tiro', who: 'homme', cat: 'vetements', store: 'Homme · Vêtements', name: 'Pantalon Tiro', tag: 'Training', price: null },
  { id: 'adidas-sac-a-dos', who: 'homme', cat: 'accessoires', store: 'Homme · Accessoires', name: 'Sac à dos Classic', tag: 'Essentiel', price: null },
  { id: 'adidas-gazelle', who: 'femme', cat: 'chaussures', store: 'Femme · Chaussures', name: 'Gazelle', tag: 'Icône', price: null },
  { id: 'adidas-ultraboost', who: 'femme', cat: 'chaussures', store: 'Femme · Chaussures', name: 'Ultraboost 1.0', tag: 'Running', price: null },
  { id: 'adidas-tshirt-trefoil', who: 'femme', cat: 'vetements', store: 'Femme · Vêtements', name: 'T-shirt Trefoil', tag: 'Essentiel', price: null },
  { id: 'adidas-casquette-trefoil', who: 'femme', cat: 'accessoires', store: 'Femme · Accessoires', name: 'Casquette Trefoil', tag: 'Essentiel', price: null },
  { id: 'adidas-superstar-enfant', who: 'enfant', cat: 'chaussures', store: 'Enfant · Chaussures', name: 'Superstar', tag: 'Icône', price: null },
  { id: 'adidas-hoodie-enfant', who: 'enfant', cat: 'vetements', store: 'Enfant · Vêtements', name: 'Sweat à capuche Essentials', tag: 'Essentiel', price: null },
  { id: 'adidas-chaussettes-enfant', who: 'enfant', cat: 'accessoires', store: 'Enfant · Accessoires', name: 'Chaussettes, 3 paires', tag: 'Lot', price: null },
]

// cat : les 8 rayons Celio repris de brands.js
export const celioCatalog = [
  { id: 'celio-chemise-oxford', cat: 'chemises', store: 'Chemises', name: 'Chemise Oxford slim', price: null },
  { id: 'celio-chemise-lin', cat: 'chemises', store: 'Chemises', name: 'Chemise en lin', price: null },
  { id: 'celio-polo-pique', cat: 'tshirts', store: 'T-shirts & polos', name: 'Polo piqué', price: null },
  { id: 'celio-tshirt-col-rond', cat: 'tshirts', store: 'T-shirts & polos', name: 'T-shirt col rond coton', price: null },
  { id: 'celio-chino-slim', cat: 'pantalons', store: 'Pantalons & chinos', name: 'Chino slim', price: null },
  { id: 'celio-pantalon-lin', cat: 'pantalons', store: 'Pantalons & chinos', name: 'Pantalon en lin', price: null },
  { id: 'celio-jean-slim', cat: 'jeans', store: 'Jeans', name: 'Jean slim brut', price: null },
  { id: 'celio-jean-straight', cat: 'jeans', store: 'Jeans', name: 'Jean straight délavé', price: null },
  { id: 'celio-pull-col-rond', cat: 'pulls', store: 'Pulls & sweats', name: 'Pull col rond', price: null },
  { id: 'celio-sweat-capuche', cat: 'pulls', store: 'Pulls & sweats', name: 'Sweat à capuche', price: null },
  { id: 'celio-veste-jean', cat: 'vestes', store: 'Vestes & blousons', name: 'Veste en jean', price: null },
  { id: 'celio-blouson', cat: 'vestes', store: 'Vestes & blousons', name: 'Blouson léger', price: null },
  { id: 'celio-boxers', cat: 'sousvet', store: 'Sous-vêtements', name: 'Boxers, lot de 3', price: null },
  { id: 'celio-ceinture', cat: 'accessoires', store: 'Accessoires', name: 'Ceinture en cuir', price: null },
]

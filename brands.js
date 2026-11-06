(function () {
  var R = window.React, h = R.createElement, useState = R.useState, useEffect = R.useEffect;
  var LOGO = window.__KLOGO; // filled by the build step
  var PHONE = "+243 818 592 999";

  /* ------------------------------------------------------------------
     CATALOGUE DATA
     To add products later, push objects into a brand's `products` array:
       { id: "unique-id", cat: "chocolats", name: "Product name",
         price: 45, desc: { fr: "…", en: "…" }, img: "data:image/…" }
     For adidas, also give `who`: "homme" | "femme" | "enfant".
     `cat` (and `who`) must match an option id below.
  ------------------------------------------------------------------ */
  var BRANDS = {
    patchi: {
      name: "Patchi", logo: LOGO.patchi, mark: LOGO.patchi, placeholder: "img/logos/patchi-placeholder.png", card: "#93B993",
      tag: { fr: "Chocolats & cadeaux", en: "Chocolates & gifts" },
      intro: {
        fr: "Chocolats fins au poids, coffrets garnis, dragées et tablettes.",
        en: "Fine chocolates by weight, filled gift boxes, dragées and bars."
      },
      groups: [{ key: "cat", style: "tiles", label: { fr: "Catégories", en: "Categories" }, options: [
        { id: "deluxe", fr: "Chocolats Deluxe", en: "Deluxe chocolates", note: { fr: "Au poids, prix au kg", en: "By weight, price per kg" } },
        { id: "classic", fr: "Chocolats classiques", en: "Classic chocolates", note: { fr: "Au poids, prix au kg", en: "By weight, price per kg" } },
        { id: "giftboxes", fr: "Coffrets cadeaux", en: "Gift boxes", note: { fr: "Grandes boîtes garnies", en: "Large filled boxes" } },
        { id: "smallboxes", fr: "Petites boîtes", en: "Small boxes", note: { fr: "Boîtes garnies, dont sans sucre ajouté", en: "Filled boxes, including no added sugar" } },
        { id: "mytreat", fr: "My Treat", en: "My Treat", note: { fr: "Sachets de dragées de 250 g", en: "250 g bags of dragées" } },
        { id: "bars", fr: "Tablettes", en: "Bars", note: { fr: "Tablettes de 100 g", en: "100 g bars" } }
      ] }],
      // From ERP Product Master, Patchi, October 2026: first 3 products of each class with more than 3 products.
      // `erp` keeps the original ERP name; `stock` is Rcvd Stock (kg for loose chocolates).
      products: [
        {"id": "ccd01", "ref": "CCD01", "cat": "deluxe", "name": "Chocolate Milk Filled with Praline", "erp": "CHOCOLATE MILK FILLED WITH PRALINE", "price": 96, "unit": "kg", "stock": 5},
        {"id": "ccd03", "ref": "CCD03", "cat": "deluxe", "name": "Capricio Chocolate", "erp": "CAPRICIO - CHOCOLATE", "price": 96, "unit": "kg", "stock": 10},
        {"id": "ccd04", "ref": "CCD04", "cat": "deluxe", "name": "Chocolate Wafer Milk Square", "erp": "CHOCOLATE WAFER MILK SQUARE", "price": 96, "unit": "kg", "stock": 16},
        {"id": "ccn01", "ref": "CCN01", "cat": "classic", "name": "Finesse Chocolate", "erp": "FINESSE - CHOCOLATE", "price": 96, "unit": "kg", "stock": 10},
        {"id": "ccn02", "ref": "CCN02", "cat": "classic", "name": "Noblesse Chocolate", "erp": "NOBLESSE - CHOCOLATE", "price": 96, "unit": "kg", "stock": 10},
        {"id": "ccn03", "ref": "CCN03", "cat": "classic", "name": "Audace Chocolate", "erp": "AUDACE - CHOCOLATE", "price": 96, "unit": "kg", "stock": 10},
        {"id": "ggf0004", "ref": "GGF0004", "cat": "giftboxes", "name": "Filled Chocolate Box 780 g", "erp": "BOX FILLED 780 GR CHOCOLATE", "price": 126, "unit": null, "stock": 6},
        {"id": "ggf0005", "ref": "GGF0005", "cat": "giftboxes", "name": "Filled Chocolate Box 1025 g", "erp": "BOX FILLED 1025 GR CHOCOLATE", "price": 163, "unit": null, "stock": 6},
        {"id": "ggf0006", "ref": "GGF0006", "cat": "giftboxes", "name": "Filled Chocolate Box 785 g", "erp": "BOX FILLED 785 GR CHOCOLATE", "price": 126, "unit": null, "stock": 6},
        {"id": "gns0009", "ref": "GNS0009", "cat": "smallboxes", "name": "Filled Chocolate Box 225 g, No Added Sugar", "erp": "BOX FILLED 225GR CHOCOLATE NO ADDED PCS SUGAR", "price": 41, "unit": null, "stock": 6},
        {"id": "gns0010", "ref": "GNS0010", "cat": "smallboxes", "name": "Filled Chocolate Box 225 g, No Added Sugar", "erp": "BOX FILLED WITH 225 GRS CHOCOLATE NOPCS ADDED SUGAR", "price": 41, "unit": null, "stock": 6},
        {"id": "gsb0003", "ref": "GSB0003", "cat": "smallboxes", "name": "Green Filled Chocolate Box 195 g", "erp": "GREEN BOX FILLED 195 GR CHOCOLATE", "price": 39, "unit": null, "stock": 6},
        {"id": "gns0013", "ref": "GNS0013", "cat": "mytreat", "name": "Dragée Diet Almond Milk, Bag 250 g", "erp": "BAG FILLED 250 GR DRAGEE DIET ALMOND PCS MILK", "price": 45, "unit": null, "stock": 3},
        {"id": "gns0014", "ref": "GNS0014", "cat": "mytreat", "name": "Dragée Diet Bitter, Bag 250 g", "erp": "BAG FILLED 250 GR DRAGEE DIET BITTER PCS", "price": 45, "unit": null, "stock": 3},
        {"id": "gns0015", "ref": "GNS0015", "cat": "mytreat", "name": "Dragée Diet Milk Hazelnut, Bag 250 g", "erp": "BAG FILLED 250 GR DRAGEE DIET MILK PCS HAZELNUT", "price": 45, "unit": null, "stock": 3},
        {"id": "gbr0001", "ref": "GBR0001", "cat": "bars", "name": "Chocolate Bar 100 g Finesse", "erp": "CHOCOALTE BAR 100 GRS FINESSE", "price": 15, "unit": null, "stock": 3},
        {"id": "gbr0002", "ref": "GBR0002", "cat": "bars", "name": "Chocolate Bar 100 g Noblesse 70%", "erp": "CHOCOALTE BAR 100 GRS NOBLESSE 70%", "price": 15, "unit": null, "stock": 2},
        {"id": "gbr0003", "ref": "GBR0003", "cat": "bars", "name": "Chocolate Bar 100 g Audace", "erp": "CHOCOALTE BAR 100GRS AUDACE", "price": 15, "unit": null, "stock": 2}
      ]
    },
    adidas: {
      name: "adidas", logo: LOGO.adidasWhite, logoCard: LOGO.adidasWhite, card: "#000",
      tag: { fr: "Sport & lifestyle", en: "Sport & lifestyle" },
      intro: {
        fr: "Chaussures, vêtements et accessoires adidas pour homme, femme et enfant.",
        en: "adidas shoes, clothing and accessories for men, women and kids."
      },
      headline: { fr: ["Homme.", "Femme.", "Enfant."], en: ["Men.", "Women.", "Kids."] },
      groups: [
        { key: "who", style: "seg", label: { fr: "Pour qui", en: "Shop for" }, options: [
          { id: "homme", fr: "Homme", en: "Men" },
          { id: "femme", fr: "Femme", en: "Women" },
          { id: "enfant", fr: "Enfant", en: "Kids" }
        ] },
        { key: "cat", style: "tiles", label: { fr: "Catégories", en: "Categories" }, options: [
          { id: "chaussures", fr: "Chaussures", en: "Shoes", note: { fr: "Running, lifestyle, football", en: "Running, lifestyle, football" } },
          { id: "vetements", fr: "Vêtements", en: "Clothing", note: { fr: "T-shirts, joggings, survêtements", en: "T-shirts, joggers, tracksuits" } },
          { id: "accessoires", fr: "Accessoires", en: "Accessories", note: { fr: "Sacs, casquettes, chaussettes", en: "Bags, caps, socks" } }
        ] }
      ],
      products: []
    },
    celio: {
      name: "Celio", logo: LOGO.celio, card: "#fff",
      tag: { fr: "Mode homme", en: "Menswear" },
      intro: {
        fr: "Chemises, jeans, chinos et tous les essentiels du vestiaire masculin.",
        en: "Shirts, jeans, chinos and every essential of a man’s wardrobe."
      },
      groups: [{ key: "cat", style: "list", label: { fr: "Catégories", en: "Categories" }, options: [
        { id: "chemises", fr: "Chemises", en: "Shirts" },
        { id: "tshirts", fr: "T-shirts & polos", en: "T-shirts & polos" },
        { id: "pantalons", fr: "Pantalons & chinos", en: "Trousers & chinos" },
        { id: "jeans", fr: "Jeans", en: "Jeans" },
        { id: "pulls", fr: "Pulls & sweats", en: "Knitwear & sweatshirts" },
        { id: "vestes", fr: "Vestes & blousons", en: "Jackets & coats" },
        { id: "sousvet", fr: "Sous-vêtements", en: "Underwear" },
        { id: "accessoires", fr: "Accessoires", en: "Accessories" }
      ] }],
      products: []
    }
  };
  var ORDER = ["patchi", "adidas", "celio"];

  var TX = {
    fr: {
      back: "Toutes les boutiques", all: "Tout voir", soon: "Bientôt",
      count: function (n) { return n + " produit" + (n > 1 ? "s" : ""); },
      allSel: "Toute la sélection",
      empty: function (b, c) { return (c ? c + " : les produits " + b + " arrivent bientôt sur kclick." : "Le catalogue " + b + " arrive bientôt sur kclick."); },
      call: "Pour commander dès maintenant, appelez le ",
      visit: "Voir la boutique", ref: "Réf.", add: "Ajouter au panier", added: "Ajouté",
      shopAll: function (n) { return "Voir la boutique " + n; },
      stock: function (n, u) { return n ? n + (u ? " " + u : "") + " en stock" : "Épuisé"; },
      by: "par Kenny’s International", rights: "© 2026 Kenny’s Group. Tous droits réservés."
    },
    en: {
      back: "All stores", all: "See all", soon: "Soon",
      count: function (n) { return n + " product" + (n > 1 ? "s" : ""); },
      allSel: "The whole selection",
      empty: function (b, c) { return (c ? c + ": " + b + " products are coming to kclick soon." : "The " + b + " catalogue is coming to kclick soon."); },
      call: "To order now, call ",
      visit: "Visit the store", ref: "Ref.", add: "Add to cart", added: "Added",
      shopAll: function (n) { return "Visit the " + n + " store"; },
      stock: function (n, u) { return n ? n + (u ? " " + u : "") + " in stock" : "Out of stock"; },
      by: "by Kenny’s International", rights: "© 2026 Kenny’s Group. All rights reserved."
    }
  };

  function getLang() { try { return localStorage.getItem("kclick-lang") || "fr"; } catch (e) { return "fr"; } }
  function setLangStore(l) { try { localStorage.setItem("kclick-lang", l); } catch (e) {} }

  var Chevron = function () {
    return h("svg", { viewBox: "0 0 10 16", width: 8, height: 13, "aria-hidden": "true" },
      h("path", { d: "M8.5 1.5L2 8l6.5 6.5", fill: "none", stroke: "currentColor", strokeWidth: 1.6 }));
  };

  function matches(p, sel) {
    for (var k in sel) { if (sel[k] && p[k] !== sel[k]) return false; }
    return true;
  }

  function AddBtn(props) {
    var st = useState(false), done = st[0], setDone = st[1];
    useEffect(function () {
      if (!done) return;
      var x = setTimeout(function () { setDone(false); }, 1600);
      return function () { clearTimeout(x); };
    }, [done]);
    return h("button", { type: "button", className: "bp-add" + (done ? " done" : ""), "aria-label": props.t.add + " : " + props.name,
      onClick: function () { props.onAdd(); setDone(true); } }, done ? props.t.added : props.t.add);
  }

  function card(b, p, lang, t, onAdd) {
    var cg = b.groups.filter(function (g) { return g.key === "cat"; })[0];
    var co = cg && cg.options.find(function (o) { return o.id === p.cat; });
    return h("article", { key: p.id, className: "bp-prod" },
      h("div", { className: "bp-pimg" }, p.img ? h("img", { src: p.img, alt: p.name, loading: "lazy" }) : b.mark && h("img", { className: "bp-mark", src: b.mark, alt: "" })),
      co && h("p", { className: "bp-pcat" }, co[lang]),
      h("h3", { className: "bp-pname" }, p.name),
      p.desc && h("p", { className: "bp-pdesc" }, p.desc[lang]),
      p.ref && h("p", { className: "bp-ref" }, t.ref + " " + p.ref),
      h("div", { className: "bp-pfoot" },
        p.price != null && h("span", { className: "bp-price" }, "$" + p.price + (p.unit ? " / " + p.unit : "")),
        p.stock != null && h("span", { className: "bp-stock" + (p.stock ? "" : " out") }, t.stock(p.stock, p.unit))),
      onAdd && p.stock !== 0 && h(AddBtn, { t: t, name: p.name, onAdd: function () { onAdd(p.id); } }));
  }

  /* One row of a brand's products for the home page, in the brand's own look */
  function Row(props) {
    var b = BRANDS[props.id], lang = TX[props.lang] ? props.lang : "fr", t = TX[lang];
    return h("section", { className: "bp bp-" + props.id + " bp-row", "aria-label": b.name },
      h("div", { className: "bp-wrap" },
        h("div", { className: "bp-row-head" },
          h("img", { className: "bp-row-logo", src: b.logo, alt: b.name }),
          h("p", { className: "bp-intro" }, b.intro[lang])),
        h("div", { className: "bp-strip" }, pickRow(b.products, 4).map(function (p) { return card(b, p, lang, t, props.onAdd); })),
        h("div", { className: "bp-cta-bar" }, h("a", { className: "bp-cta", href: "#" + props.id }, t.shopAll(b.name)))));
  }
  function pickRow(list, n) {
    var seen = {}, out = [];
    list.forEach(function (p) { if (out.length < n && !seen[p.cat]) { seen[p.cat] = 1; out.push(p); } });
    list.forEach(function (p) { if (out.length < n && out.indexOf(p) < 0) out.push(p); });
    return out;
  }
  function rows(lang, onAdd) {
    return ORDER.filter(function (id) { return BRANDS[id].products.length; })
      .map(function (id) { return h(Row, { key: "row-" + id, id: id, lang: lang, onAdd: onAdd }); });
  }
  /* Brand products in the shape the Kyra cart, hero and drawer expect */
  function find(pid) {
    for (var k in BRANDS) {
      var b = BRANDS[k], p = b.products.find(function (x) { return x.id === pid; });
      if (p) {
        var cg = b.groups.filter(function (g) { return g.key === "cat"; })[0];
        var co = (cg && cg.options.find(function (o) { return o.id === p.cat; })) || { fr: b.name, en: b.name };
        return { id: p.id, house: k, name: p.name, price: p.price, cls: p.cat,
          desc: { fr: co.fr + (p.unit ? ", prix au " + p.unit : ""), en: co.en + (p.unit ? ", price per " + p.unit : "") } };
      }
    }
  }
  /* Placeholder photos until product images arrive: the brand logo on its colour */
  function phTile(src, bg, ratio) {
    var w = 200, hh = Math.round(w / ratio);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><rect width="480" height="480" fill="' + bg + '"/><image href="' + src + '" x="' + (240 - w / 2) + '" y="' + (240 - hh / 2) + '" width="' + w + '" height="' + hh + '"/></svg>');
  }
  ORDER.forEach(function (id) {
    BRANDS[id].products.forEach(function (p) {
      p.name = p.name.replace(/(\d) (g|kg)\b/g, "$1\u00a0$2");
      if (!p.img && BRANDS[id].placeholder) p.img = BRANDS[id].placeholder;
      if (p.img && window.__KIMG) window.__KIMG["img/" + p.id + ".webp"] = p.img;
    });
  });

  function Page(props) {
    var id = props.id, b = BRANDS[id];
    var lang = TX[props.lang] ? props.lang : "fr";
    var ss = useState({}), sel = ss[0], setSel = ss[1];
    var t = TX[lang];

    var pick = function (key, val, scroll) {
      setSel(function (s) { var n = Object.assign({}, s); n[key] = s[key] === val ? null : val; return n; });
      if (scroll) {
        var el = document.getElementById("bp-results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    var countFor = function (key, val) {
      var s = Object.assign({}, sel); s[key] = val;
      return b.products.filter(function (p) { return matches(p, s); }).length;
    };
    var shown = b.products.filter(function (p) { return matches(p, sel); });
    var activeLabels = b.groups.map(function (g) {
      var o = g.options.find(function (o) { return o.id === sel[g.key]; });
      return o ? o[lang] : null;
    }).filter(Boolean);

    var group = function (g) {
      var isSeg = g.style === "seg";
      return h("div", { key: g.key, className: "bp-group bp-" + g.style },
        h("h2", { className: "bp-glabel" }, g.label[lang]),
        h("div", { className: "bp-opts", role: isSeg ? "group" : null, "aria-label": isSeg ? g.label[lang] : null },
          isSeg && h("button", { type: "button", className: "bp-opt" + (!sel[g.key] ? " on" : ""), "aria-pressed": !sel[g.key],
            onClick: function () { setSel(function (s) { var n = Object.assign({}, s); n[g.key] = null; return n; }); } }, t.all),
          g.options.map(function (o) {
            var n = countFor(g.key, o.id), on = sel[g.key] === o.id;
            return h("button", { key: o.id, type: "button", className: "bp-opt" + (on ? " on" : ""), "aria-pressed": on,
              onClick: function () { pick(g.key, o.id, !isSeg); } },
              h("span", { className: "bp-oname" }, o[lang]),
              !isSeg && o.note && h("span", { className: "bp-onote" }, o.note[lang]),
              !isSeg && h("span", { className: "bp-ocount" }, b.products.length ? t.count(n) : t.soon));
          })));
    };

    return h("div", { className: "bp bp-" + id },
      h("div", { className: "bp-main" },
        h("section", { className: "bp-hero" },
          h("div", { className: "bp-wrap bp-hero-in" },
            h("h1", { className: "bp-logo" }, h("img", { src: b.logo, alt: b.name })),
            h("div", { className: "bp-hero-tx" },
              b.headline && h("p", { className: "bp-headline" }, b.headline[lang].map(function (w) { return h("span", { key: w }, w); })),
              h("p", { className: "bp-tag" }, b.tag[lang]),
              h("p", { className: "bp-intro" }, b.intro[lang])))),
        h("section", { className: "bp-cats" },
          h("div", { className: "bp-wrap" }, b.groups.map(group))),
        h("section", { className: "bp-results", id: "bp-results" },
          h("div", { className: "bp-wrap" },
            h("h2", { className: "bp-rtitle" }, activeLabels.length ? activeLabels.join(" · ") : t.allSel),
            shown.length
              ? h("div", { className: "bp-grid" }, shown.map(function (p) {
                  return card(b, p, lang, t, props.onAdd);
                }))
              : h("div", { className: "bp-empty" },
                  h("p", null, t.empty(b.name, activeLabels.join(" · "))),
                  h("p", null, t.call, h("a", { href: "tel:+243818592999" }, PHONE), "."))))));
  }

  /* Store cards for the home page's "Nos boutiques" section */
  function cards(Rx, lang, Arrow) {
    var t = TX[lang] || TX.fr, ce = Rx.createElement;
    return ORDER.map(function (id) {
      var b = BRANDS[id];
      return ce("article", { className: "store", key: id },
        ce("a", { className: "store-ph bp-card bp-card-" + id, href: "#" + id, "aria-label": b.name + " : " + t.visit },
          ce("img", { src: b.logoCard || b.logo, alt: "" })),
        ce("p", { className: "cap gold" }, b.tag[lang] || b.tag.fr),
        ce("h3", { className: "wide h3" }, b.name),
        ce("p", { className: "store-tx" }, b.intro[lang] || b.intro.fr),
        ce("a", { className: "lnk", href: "#" + id }, t.visit, " ", Arrow ? ce(Arrow) : null));
    });
  }

  function mount(Home) {
    var cur = function () { var k = location.hash.slice(1); return BRANDS[k] || k === "kyra" || k === "contact" ? k : null; };
    var useLayout = R.useLayoutEffect || useEffect;
    function Router() {
      var st = useState(cur), b = st[0], setB = st[1];
      useEffect(function () {
        var f = function () { setB(cur()); };
        window.addEventListener("hashchange", f);
        return function () { window.removeEventListener("hashchange", f); };
      }, []);
      useLayout(function () {
        document.title = b === "kyra" ? "kclick · Kyra" : b === "contact" ? "kclick · Contact" : b ? "kclick · " + BRANDS[b].name : "kclick";
        var go = b ? window.__kGo : location.hash.slice(1);
        window.__kGo = null;
        var el = go && document.getElementById(go);
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
        else window.scrollTo({ top: 0, behavior: "instant" });
      }, [b]);
      return h(Home, { view: b || "home" });
    }
    window.ReactDOM.createRoot(document.getElementById("root")).render(h(Router));
  }

  var CT = {
    fr: {
      eyebrow: "Service client", title: "Nous contacter",
      lede: "Une question sur un produit, une commande ou une livraison ? Appelez-nous ou écrivez-nous.",
      phone: "Téléphone", email: "E-mail", address: "Adresse", follow: "Réseaux sociaux",
      addr: ["124 Boulevard du 30 Juin, Gombe, Kinshasa", "Royal building, réf. K Lounge, en face d’Interpol"],
      form: "Écrire au service client", name: "Votre nom", reach: "Votre téléphone ou e-mail",
      subject: "Sujet", subjects: ["Une commande", "Un produit", "La livraison", "Autre"],
      message: "Votre message", send: "Préparer l’e-mail",
      note: "Le bouton ouvre votre messagerie avec le message prêt à envoyer à serviceclient@kennysinternational.com.",
      missing: "Écrivez votre message avant de l’envoyer.", from: "De", contact: "Contact"
    },
    en: {
      eyebrow: "Customer service", title: "Contact us",
      lede: "A question about a product, an order or a delivery? Call us or write to us.",
      phone: "Phone", email: "Email", address: "Address", follow: "Social media",
      addr: ["124 Boulevard du 30 Juin, Gombe, Kinshasa", "Royal building, ref. K Lounge, opposite Interpol"],
      form: "Write to customer service", name: "Your name", reach: "Your phone or email",
      subject: "Subject", subjects: ["An order", "A product", "Delivery", "Other"],
      message: "Your message", send: "Prepare the email",
      note: "The button opens your email app with the message ready to send to serviceclient@kennysinternational.com.",
      missing: "Write your message before sending it.", from: "From", contact: "Contact"
    }
  };
  var MAIL = "serviceclient@kennysinternational.com";
  function Contact(props) {
    var c = CT[props.lang] || CT.fr;
    var f = useState({ name: "", reach: "", subject: 0, message: "" }), v = f[0], setV = f[1];
    var er = useState(false), err = er[0], setErr = er[1];
    var set = function (k) { return function (ev) { var n = Object.assign({}, v); n[k] = ev.target.value; setV(n); if (k === "message") setErr(false); }; };
    var send = function () {
      if (!v.message.trim()) { setErr(true); return; }
      var body = v.message.trim() + "\n\n" + c.from + " : " + [v.name, v.reach].filter(Boolean).join(", ");
      var href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("kclick : " + c.subjects[v.subject]) + "&body=" + encodeURIComponent(body);
      window.location.href = href;
    };
    var field = function (id, label, el) {
      return h("div", { className: "ct-field" }, h("label", { htmlFor: id }, label), el);
    };
    return h("section", { className: "sec ct", id: "nous-contacter" },
      h("div", { className: "wrap" },
        h("div", { className: "sec-head" },
          h("div", null, h("p", { className: "cap gold" }, c.eyebrow), h("h1", { className: "wide h2" }, c.title)),
          h("p", { className: "sec-lede" }, c.lede)),
        h("div", { className: "ct-grid" },
          h("dl", { className: "ct-info" },
            h("div", null, h("dt", { className: "cap gold" }, c.phone), h("dd", null, h("a", { href: "tel:+243818592999" }, "+243 818 592 999"))),
            h("div", null, h("dt", { className: "cap gold" }, c.email), h("dd", null, h("a", { href: "mailto:" + MAIL }, MAIL))),
            h("div", null, h("dt", { className: "cap gold" }, c.address), h("dd", null, c.addr[0], h("br"), c.addr[1])),
            h("div", null, h("dt", { className: "cap gold" }, c.follow), h("dd", { className: "ct-social" },
              h("a", { href: "https://www.instagram.com/kennysinternational/", target: "_blank", rel: "noreferrer" }, "Instagram"),
              h("a", { href: "https://www.facebook.com/KennysInternationals", target: "_blank", rel: "noreferrer" }, "Facebook"),
              h("a", { href: "https://www.linkedin.com/company/kennysinternational/", target: "_blank", rel: "noreferrer" }, "LinkedIn")))),
          h("div", { className: "ct-form" },
            h("h2", { className: "wide h3" }, c.form),
            h("div", { className: "ct-row" },
              field("ct-name", c.name, h("input", { id: "ct-name", type: "text", autoComplete: "name", value: v.name, onChange: set("name") })),
              field("ct-reach", c.reach, h("input", { id: "ct-reach", type: "text", autoComplete: "email", value: v.reach, onChange: set("reach") }))),
            field("ct-subject", c.subject, h("select", { id: "ct-subject", value: v.subject, onChange: set("subject") },
              c.subjects.map(function (s, i) { return h("option", { key: s, value: i }, s); }))),
            field("ct-msg", c.message, h("textarea", { id: "ct-msg", rows: 6, value: v.message, onChange: set("message"), "aria-invalid": err, "aria-describedby": err ? "ct-err" : null })),
            err && h("p", { className: "ct-err", id: "ct-err", role: "alert" }, c.missing),
            h("button", { type: "button", className: "btn solid", onClick: send }, c.send),
            h("p", { className: "ct-note" }, c.note)))));
  }

  window.KBrand = { BRANDS: BRANDS, cards: cards, mount: mount, Contact: Contact, Page: Page, rows: rows, find: find,
    shopAll: function (n, l) { return (TX[l] || TX.fr).shopAll(n); } };
})();

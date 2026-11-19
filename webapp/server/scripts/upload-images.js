// Envoie les photos produits dans Supabase Storage (un bucket par Maison) et met à jour product_images.
//
//   npm run images:upload                 photos de webapp/supabase/images/<maison>/<CODE>/
//   npm run images:upload -- --dry-run    montre ce qui serait fait, sans rien envoyer
//   npm run images:upload -- --from-site  envoie aussi les photos actuelles du site (client/public/img)
//                                         des produits dont l'image pointe encore vers /img/…
//
// Variables (fichier webapp/server/.env) : DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// La clé « service_role » donne tous les droits sur le projet : seulement dans .env, jamais commitée, jamais dans le front.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, transaction } from '../src/config/db.js'
import { env } from '../src/config/env.js'

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const FROM_SITE = args.has('--from-site')
const IMAGES = fileURLToPath(new URL('../../supabase/images/', import.meta.url))
const SITE_PUBLIC = fileURLToPath(new URL('../../client/public/', import.meta.url))
const BUCKETS = ['kyra', 'patchi', 'adidas', 'celio']
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' }

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY && !DRY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante dans webapp/server/.env (Supabase › Project Settings › API keys).')
  console.error('Astuce : --dry-run fonctionne sans la clé.')
  process.exit(1)
}

const publicUrl = (bucket, path) => `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`

async function upload(bucket, path, file) {
  if (DRY) return
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      'Content-Type': TYPES[extname(file).toLowerCase()],
      'x-upsert': 'true',
      'Cache-Control': 'max-age=31536000',
    },
    body: readFileSync(file),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
}

async function findProduct(bucket, code) {
  const { rows } = await pool.query(
    `select p.id, p.slug, p.ref, p.name_fr from public.products p join public.brands b on b.id = p.brand_id
      where b.slug = $1 and (upper(p.ref) = upper($2) or lower(p.slug) = lower($2))`,
    [bucket, code],
  )
  return rows[0] ?? null
}

async function replaceImages(product, urls) {
  if (DRY) return
  await transaction(async (db) => {
    await db.query('delete from public.product_images where product_id = $1', [product.id])
    for (const [i, url] of urls.entries())
      await db.query('insert into public.product_images (product_id, url, alt, position) values ($1, $2, $3, $4)', [product.id, url, product.name_fr, i])
  })
}

const report = { uploaded: 0, products: 0, skipped: [], unknown: [] }

/* ---------- 1. Dossier webapp/supabase/images/<maison>/<CODE>/ ---------- */
async function fromFolders() {
  for (const bucket of BUCKETS) {
    const dir = join(IMAGES, bucket)
    if (!existsSync(dir)) continue
    for (const code of readdirSync(dir).sort()) {
      const folder = join(dir, code)
      if (!statSync(folder).isDirectory()) continue
      const files = readdirSync(folder).filter((f) => TYPES[extname(f).toLowerCase()]).sort()
      if (!files.length) {
        report.skipped.push(`${bucket}/${code} (aucune photo)`)
        continue
      }
      const product = await findProduct(bucket, code)
      if (!product) {
        report.unknown.push(`${bucket}/${code}`)
        continue
      }
      const urls = []
      for (const [i, f] of files.entries()) {
        const path = `products/${code.toUpperCase()}/${i + 1}${extname(f).toLowerCase()}`
        await upload(bucket, path, join(folder, f))
        urls.push(publicUrl(bucket, path))
        report.uploaded++
      }
      await replaceImages(product, urls)
      report.products++
      console.log(`${DRY ? '[essai] ' : ''}${bucket}/${code} : ${files.length} photo(s) → ${product.name_fr}`)
    }
  }
}

/* ---------- 2. --from-site : photos actuelles du site (/img/…) ---------- */
async function fromSite() {
  const { rows } = await pool.query(
    `select i.id, i.url, b.slug as bucket, p.slug, p.ref from public.product_images i
       join public.products p on p.id = i.product_id join public.brands b on b.id = p.brand_id
      where i.url like '/img/%' order by b.slug, p.slug, i.position`,
  )
  for (const img of rows) {
    const file = join(SITE_PUBLIC, decodeURIComponent(img.url.slice(1)))
    if (!existsSync(file) || !TYPES[extname(file).toLowerCase()]) {
      report.skipped.push(`${img.url} (fichier introuvable)`)
      continue
    }
    const name = img.url.split('/').pop()
    const path = `products/${(img.ref ?? img.slug).toUpperCase()}/${name}`
    await upload(img.bucket, path, file)
    if (!DRY) await pool.query('update public.product_images set url = $2 where id = $1', [img.id, publicUrl(img.bucket, path)])
    report.uploaded++
    console.log(`${DRY ? '[essai] ' : ''}${img.url} → ${img.bucket}/${path}`)
  }
}

try {
  await fromFolders()
  if (FROM_SITE) await fromSite()
  console.log(`\n${DRY ? 'Essai (rien envoyé) : ' : ''}${report.uploaded} photo(s), ${report.products} produit(s) mis à jour.`)
  if (report.unknown.length) console.log(`Codes inconnus (dossier sans produit correspondant) : ${report.unknown.join(', ')}`)
  if (report.skipped.length) console.log(`Ignorés : ${report.skipped.join(', ')}`)
} catch (err) {
  console.error('Échec :', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}

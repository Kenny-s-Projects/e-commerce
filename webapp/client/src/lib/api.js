import { getAccessToken } from './supabase.js'

/*
 * Appels à l'API Express (webapp/server). Un seul endroit pour l'adresse, le jeton et les erreurs.
 *   const products = await api.get('/catalog/products', { brand: 'patchi' })
 *   await api.post('/orders', checkout)
 * En cas d'erreur : ApiError { status, code, message, details, requestId } (message en français, prêt à afficher).
 */
const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '') + '/api/v1'

export class ApiError extends Error {
  constructor({ status, code, message, details, requestId }) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

async function request(method, path, { query, body, auth = true } = {}) {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = await getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK', message: 'Connexion au serveur impossible. Vérifiez votre connexion internet.' })
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error ?? {}
    throw new ApiError({ status: res.status, code: e.code ?? 'ERROR', message: e.message ?? 'Une erreur est survenue.', details: e.details, requestId: e.requestId })
  }
  return data
}

export const api = {
  get: (path, query, opts) => request('GET', path, { ...opts, query }),
  post: (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
}

/** Adresse des photos : chemin du site (/img/…) ou URL Supabase Storage */
export const imageUrl = (url) => url ?? null

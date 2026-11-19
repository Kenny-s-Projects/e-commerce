// Paiement à la livraison : rien à démarrer, le livreur encaisse (voir deliveries).
export async function start() { return { status: 'en_attente' } }
export async function verify() { return null }
export async function refund() { return { status: 'en_attente' } } // remboursé à la main

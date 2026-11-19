import { events } from '../../shared/events.js'

// Réactions des paiements aux événements des commandes.
// part.refused / order.cancelled : créer le remboursement si la commande était déjà payée.
events.on('part.refused', async () => {})
events.on('order.cancelled', async () => {})

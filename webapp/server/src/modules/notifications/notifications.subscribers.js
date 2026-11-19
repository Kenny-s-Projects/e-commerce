import { events } from '../../shared/events.js'

// Réactions des notifications aux événements.
// order.created  : une notification par brand concernée + confirmation au client
// part.refused   : message au client (ce qui manque, nouveau total, possibilité d'annuler)
// order.ready / rider.assigned / order.delivered : suivi client et livreur
events.on('order.created', async () => {})
events.on('part.refused', async () => {})

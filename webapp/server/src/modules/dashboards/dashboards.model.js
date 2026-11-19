// Données des 4 dashboards : accès aux données (SQL uniquement, à écrire)
import { query } from '../../config/db.js'

export const getDashboardData = async () => {
 const result = await query('select * from public.orders order by created_at desc limit 10'
 )
  // TODO : récupérer les données du dashboard (commandes, livreurs, etc.)
  return result.rows[0] || null
}
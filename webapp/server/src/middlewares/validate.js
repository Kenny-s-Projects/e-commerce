import { badRequest } from '../shared/errors.js'

/**
 * Vérifie body / params / query avec des schémas Zod, et remplace les valeurs par les valeurs propres.
 *   router.post('/', validate({ body: createOrderSchema }), controller.create)
 */
export const validate = (schemas) => (req, res, next) => {
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue
    const result = schemas[key].safeParse(req[key] ?? {})
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      return next(badRequest('VALIDATION_FAILED', 'Données invalides', details))
    }
    // Express 5 : req.query est en lecture seule, on garde la version propre dans req.valid
    req.valid = { ...req.valid, [key]: result.data }
  }
  next()
}

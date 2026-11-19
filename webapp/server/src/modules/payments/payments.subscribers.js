// Les paiements ne réagissent à aucun événement : les commandes et les parts appellent directement
// payments.service dans leur transaction (annulation, refus d'une part), pour que tout soit enregistré ensemble.
// Ce module émet : payment.confirmed, payment.failed, refund.done (écoutés par les notifications).

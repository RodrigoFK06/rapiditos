export const ORDER_STATUS = {
  NUEVO: "Nuevo",
  PREPARANDO: "Preparando",
  ENVIANDO: "Enviando",
  COMPLETADOS: "Completados",
  CANCELADO: "Cancelado",
} as const

export type OrderStatusLiteral = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

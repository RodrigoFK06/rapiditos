export type UserRole = "client" | "rider" | "restaurant" | "admin"
import type { DocumentReference } from "firebase/firestore"

export interface User {
  uid: string
  display_name: string
  email: string
  phone: string
  photo_url: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  address?: DocumentReference
  rider_ref?: DocumentReference
}

export interface Rider {
  id: string
  uid?: string
  display_name: string
  phone: string
  photo_url: string
  user_name: string
  user_ref: DocumentReference
  active_rider: boolean
  active_orders?: number
  number_deliverys?: number
  vehicle_type?: string
  license_plate?: string
  total_deliveries?: number
  rating?: number
  last_delivery_date?: Date
}

export interface Restaurant {
  id: string
  uid?: string
  name: string
  addressText: string
  category: string
  city: string
  district?: string
  isActive: boolean
  description: string
  managerName: string
  managerLastName?: string
  restaurantPhone: number // ✅ Integer según esquema
  restaurantEmail?: string
  webSite?: string
  reference_place?: string
  imageUrl: string
  doc_ruc_url?: string
  doc_id_url?: string
  doc_license_url?: string
  userId: DocumentReference
  numDoc: number // ✅ Integer según esquema
  typeDoc: string
  yearFundation?: string // ✅ String según esquema
  instagram?: string // ✅ Agregado según esquema
  facebook?: string // ✅ Agregado según esquema
  restaurant_zone?: string // ✅ Agregado según esquema
  days?: RestaurantDay[]
  categorias?: { NombreCategoria: string }[]
  platillos?: Dish[]
}

export interface RestaurantDay {
  day: string
  isOpen: boolean
  start?: string
  end?: string
}

export interface Dish {
  id?: string
  Nombre?: string
  Descripcion?: string
  Precio?: number
  Activo?: boolean
  Imagen?: string
  Categoria?: string
  nombre?: string
  descripcion?: string
  precio?: number
  categoria?: string
  imagen?: string
  activo?: boolean
}

export type OrderStatus = "Nuevo" | "Preparando" | "Enviando" | "Completados" | "Cancelado"

export interface Order {
  id: string
  cliente_id: string
  cliente_nombre: string
  cliente_ref: DocumentReference
  client_address_ref: DocumentReference
  assigned_rider_ref?: DocumentReference
  rider_ref?: DocumentReference
  restaurantref: DocumentReference
  estado: OrderStatus
  metodo_pago: string
  note?: string
  pedido_id: string
  total: number
  tip?: number
  tiempo_estimado?: number
  ready_to_pay: boolean
  fecha_creacion: Date
  fecha_entrega?: Date
  restaurant_image: string
  restaurante_nombre: string
  asigned: boolean
  activo: boolean
}

export interface OrderDetail {
  id: string
  orderref: DocumentReference
  platilloref: DocumentReference
  restaurantref: DocumentReference
  userref: DocumentReference
  cantidad: number
  precio_unitario: number
  subtotal: number
  nombre: string
  imagen: string
}

export interface ClientAddress {
  id: string
  uid?: string
  ZIP_code: string
  address: string
  tag: string
  number_floor?: string
  business_name?: string
  delivery_options: string
  instructions_base?: string
  clientref: DocumentReference
}

export interface Chat {
  id: string
  chatnumber: string
  orderref?: DocumentReference
}

export interface Message {
  id: string
  chat_ref: DocumentReference
  clientref: DocumentReference
  clientext?: string
  ridertext?: string
  admintext?: string
  timestamp: Date
}

export interface AssignedRider {
  id: string
  client_ref: DocumentReference
  rider_ref: DocumentReference
  order_ref: DocumentReference
  client_address: DocumentReference
}

export interface DashboardStats {
  activeOrders: number
  connectedRiders: number
  totalRevenue: number
  totalOrders: number
  restaurantCount: number
  userCount: number
}

export interface DashboardKpis {
  incomeToday: number
  incomeWeek: number
  incomeMonth: number
  newUsersToday: number
  conversionRate: number
  avgDeliveryMinutes: number
}
export interface OrdersStats {
  total: number
  completed: number
  pending: number
  canceled: number
  totalRevenue: number
  completionRate: number
  perDay: { date: string; count: number }[]
  perDay30?: { date: string; count: number }[]
  paymentMethods: { name: string; count: number }[]
}

export interface TopDish {
  name: string
  count: number
  image?: string
  revenue?: number
}

export interface RidersStats {
  totalActive: number
  totalDeliveries: number
  topRiders: { id: string; display_name: string; phone: string; count: number }[]
}

export interface RestaurantsStats {
  totalActive: number
  topRestaurants: {
    id: string
    name: string
    phone: number // ✅ Corregido a number para consistencia
    orders: number
    revenue: number
    topDish?: string
  }[]
}

export interface TimeStats {
  perDay: { date: string; avg: number }[]
  perHour: { hour: string; count: number }[]
}

export interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  created_at: Date
}

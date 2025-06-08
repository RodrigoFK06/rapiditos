export type UserRole = "client" | "rider" | "restaurant" | "admin"

export interface User {
  uid: string
  display_name: string
  email: string
  phone: string
  photo_url: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  rider_ref?: string
}

export interface Rider {
  id: string
  display_name: string
  phone: string
  photo_url: string
  user_name: string
  user_ref: string
  isActive?: boolean
}

export interface Restaurant {
  id: string
  name: string
  addressText: string
  category: string
  city: string
  district: string
  isActive: boolean
  description: string
  managerName: string
  managerLastName: string
  restaurantPhone: string
  restaurantEmail: string
  webSite?: string
  reference_place?: string
  imageUrl: string
  userId: string
  numDoc: string
  typeDoc: string
  yearFundation: number
  days: RestaurantDay[]
  categorias: string[]
  platillos: Dish[]
}

export interface RestaurantDay {
  day: string
  isOpen: boolean
  start: string
  end: string
}

export interface Dish {
  id?: string
  Nombre: string
  Descripcion: string
  Precio: number
  Activo: boolean
  Imagen: string
  Categoria: string
}

export type OrderStatus = "Nuevo" | "Preparando" | "Enviando" | "Completado"

export interface Order {
  id: string
  cliente_id: string
  cliente_nombre: string
  cliente_ref: string
  client_address_ref: string
  assigned_rider_ref?: string
  rider_ref?: string
  restaurantref: string
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
  orderref: string
  platilloref: string
  restaurantref: string
  userref: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  nombre: string
  imagen: string
}

export interface ClientAddress {
  id: string
  ZIP_code: string
  address: string
  tag: string
  number_floor?: string
  business_name?: string
  delivery_options: string
  instructions_base?: string
  clientref: string
}

export interface Chat {
  id: string
  chatnumber: string
}

export interface Message {
  id: string
  chat_ref: string
  clientref: string
  clientext?: string
  ridertext?: string
  timestamp: Date
}

export interface AssignedRider {
  id: string
  client_ref: string
  rider_ref: string
  order_ref: string
  client_address: string
}

export interface DashboardStats {
  activeOrders: number
  connectedRiders: number
  totalRevenue: number
  totalOrders: number
  restaurantCount: number
  userCount: number
}

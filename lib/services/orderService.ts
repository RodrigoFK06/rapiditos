import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  orderBy,
  type DocumentData,
  type DocumentSnapshot,
  type DocumentReference,
} from "firebase/firestore"
import { db } from "../firebase"
import type { Order, OrderDetail, OrderStatus } from "../types"
import { Timestamp } from "firebase/firestore"

const mapOrder = (docSnap: DocumentSnapshot<DocumentData>): Order => {
  const data = docSnap.data() as DocumentData
  return {
    id: docSnap.id,
    ...data,
    fecha_creacion:
      data.fecha_creacion instanceof Timestamp
        ? data.fecha_creacion.toDate()
        : data.fecha_creacion,
    fecha_entrega:
      data.fecha_entrega instanceof Timestamp
        ? data.fecha_entrega.toDate()
        : data.fecha_entrega,
  } as Order
}

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", id))
    if (orderDoc.exists()) {
      const data = orderDoc.data() as any
      // Seguridad: tratar admin_view ausente como false
      if (data?.admin_view === true) {
        return mapOrder(orderDoc)
      }
      return null
    }
    return null
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    // Mostrar únicamente pedidos confirmados para vista admin
    const q = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      orderBy("fecha_creacion", "desc")
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((d) => mapOrder(d))
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export const getActiveOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      where("activo", "==", true),
      where("estado", "in", ["Nuevo", "Preparando", "Enviando"]),
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((d) => mapOrder(d))
  } catch (error) {
    console.error("Error fetching active orders:", error)
    return []
  }
}

export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      where("estado", "==", status)
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((d) => mapOrder(d))
  } catch (error) {
    console.error(`Error fetching ${status} orders:`, error)
    return []
  }
}

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "orders", id), {
      estado: status,
  ...(status === "Completados" ? { fecha_entrega: new Date() } : {}),
    })
    return true
  } catch (error) {
    console.error("Error updating order status:", error)
    return false
  }
}

export const assignRiderToOrder = async (orderId: string, riderId: string): Promise<DocumentReference | null> => {
  try {
    const orderRef = doc(db, "orders", orderId)
    const riderRef = doc(db, "rider", riderId)
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) return null
    const order = orderDoc.data() as Order
    const assignedRef = await addDoc(collection(db, "asigned_rider"), {
      client_ref: order.cliente_ref,
      rider_ref: riderRef,
      order_ref: orderRef,
      client_address: order.client_address_ref,
    })
    await updateDoc(orderRef, {
      assigned_rider_ref: assignedRef,
      asigned: true,
    })
    return assignedRef
  } catch (error) {
    console.error("Error assigning rider to order:", error)
    return null
  }
}

export const getOrderDetails = async (orderId: string): Promise<OrderDetail[]> => {
  try {
    const orderRef = doc(db, "orders", orderId)
    const q = query(collection(db, "orderdetails"), where("orderref", "==", orderRef))
    const detailsSnapshot = await getDocs(q)
    return detailsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OrderDetail)
  } catch (error) {
    console.error("Error fetching order details:", error)
    return []
  }
}
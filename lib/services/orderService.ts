import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc, orderBy } from "firebase/firestore"
import { db } from "../firebase"
import type { Order, OrderDetail, OrderStatus } from "../types"

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", id))
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order
    }
    return null
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, "orders"), orderBy("fecha_creacion", "desc"))
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export const getActiveOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("activo", "==", true),
      where("estado", "in", ["Nuevo", "Preparando", "Enviando"]),
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  } catch (error) {
    console.error("Error fetching active orders:", error)
    return []
  }
}

export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const q = query(collection(db, "orders"), where("estado", "==", status))
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  } catch (error) {
    console.error(`Error fetching ${status} orders:`, error)
    return []
  }
}

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "orders", id), {
      estado: status,
      ...(status === "Completado" ? { fecha_entrega: new Date() } : {}),
    })
    return true
  } catch (error) {
    console.error("Error updating order status:", error)
    return false
  }
}

export const assignRiderToOrder = async (orderId: string, riderId: string): Promise<boolean> => {
  try {
    // Update the order
    await updateDoc(doc(db, "orders", orderId), {
      assigned_rider_ref: riderId,
      asigned: true,
    })

    // Get the order details
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (!orderDoc.exists()) return false
    const order = orderDoc.data() as Order

    // Create an entry in asigned_rider collection
    await addDoc(collection(db, "asigned_rider"), {
      client_ref: order.cliente_ref,
      rider_ref: riderId,
      order_ref: orderId,
      client_address: order.client_address_ref,
    })

    return true
  } catch (error) {
    console.error("Error assigning rider to order:", error)
    return false
  }
}

export const getOrderDetails = async (orderId: string): Promise<OrderDetail[]> => {
  try {
    const q = query(collection(db, "orderdetails"), where("orderref", "==", orderId))
    const detailsSnapshot = await getDocs(q)
    return detailsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OrderDetail)
  } catch (error) {
    console.error("Error fetching order details:", error)
    return []
  }
}

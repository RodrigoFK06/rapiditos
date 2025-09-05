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
  runTransaction,
  serverTimestamp,
  increment,
  deleteField,
  type DocumentData,
  type DocumentSnapshot,
  type DocumentReference,
} from "firebase/firestore"
import { db } from "../firebase"
import { ORDER_STATUS } from "../constants/status"
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
    // Fallback sin índice: filtrar por admin_view y ordenar en memoria
    const errAny = error as any
    console.warn("getAllOrders: usando fallback sin índice", errAny?.message || errAny)
    try {
      const qSimple = query(collection(db, "orders"), where("admin_view", "==", true))
      const snap = await getDocs(qSimple)
      const items = snap.docs.map((d) => mapOrder(d))
      // Orden en memoria por fecha_creacion desc
      items.sort((a: any, b: any) => {
        const da = a?.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0
        const dbt = b?.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0
        return dbt - da
      })
      return items
    } catch (fallbackErr) {
      console.error("getAllOrders fallback failed:", fallbackErr)
      return []
    }
  }
}

export const getActiveOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      where("activo", "==", true),
      where("estado", "in", [
        ORDER_STATUS.NUEVO,
        ORDER_STATUS.PREPARANDO,
        ORDER_STATUS.ENVIANDO,
      ]),
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((d) => mapOrder(d))
  } catch (error) {
    console.warn("getActiveOrders: usando fallback sin índice")
    try {
      // Traer admin_view=true y filtrar en memoria
      const qSimple = query(collection(db, "orders"), where("admin_view", "==", true))
      const snap = await getDocs(qSimple)
      return snap.docs
        .map((d) => mapOrder(d))
        .filter((o: any) =>
          o?.activo === true && [
            ORDER_STATUS.NUEVO,
            ORDER_STATUS.PREPARANDO,
            ORDER_STATUS.ENVIANDO,
          ].includes(o?.estado)
        )
    } catch (fallbackErr) {
      console.error("getActiveOrders fallback failed:", fallbackErr)
      return []
    }
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
    console.warn(`getOrdersByStatus: usando fallback sin índice para ${status}`)
    try {
      const qSimple = query(collection(db, "orders"), where("admin_view", "==", true))
      const snap = await getDocs(qSimple)
      return snap.docs
        .map((d) => mapOrder(d))
        .filter((o: any) => o?.estado === status)
    } catch (fallbackErr) {
      console.error("getOrdersByStatus fallback failed:", fallbackErr)
      return []
    }
  }
}

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "orders", id), {
      estado: status,
  ...(status === ORDER_STATUS.COMPLETADOS ? { fecha_entrega: new Date() } : {}),
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
    const order = orderDoc.data() as any
    const clientRef = order.clienteref ?? order.cliente_ref ?? order.client_ref ?? null
    const clientAddrRef = order.client_address_ref ?? order.clientaddress_ref ?? null
    const payload: Record<string, any> = {
      client_ref: clientRef ?? null,
      client_address: clientAddrRef ?? null,
      order_ref: orderRef,
      rider_ref: riderRef,
    }
    const assignedRef = await addDoc(collection(db, "asigned_rider"), payload)
    await updateDoc(orderRef, {
      asigned_rider_ref: assignedRef,
      assigned_rider_ref: assignedRef,
      asigned: true,
      rider_ref: riderRef,
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

// ========================= TRANSACCIONALES =========================

/**
 * Asigna un rider a una orden en una sola transacción, con validaciones e idempotencia.
 * @param orderId ID de la orden
 * @param riderRefPath Ruta del rider, p.ej. "/rider/PNQu5KDsGuEjCoveAw6g"
 */
export const assignRiderTransactional = async (
  orderId: string,
  riderRefPath: string
): Promise<void> => {
  const cleanPath = riderRefPath.replace(/^\/+/, "")
  const parts = cleanPath.split("/")
  if (parts.length !== 2 || parts[0] !== "rider") {
    throw new Error("riderRefPath inválido. Debe ser /rider/{riderId}")
  }
  const riderRef = doc(db, parts[0], parts[1])
  const orderRef = doc(db, "orders", orderId)
  const assignedCol = collection(db, "asigned_rider")

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists()) throw new Error("ORDER_NOT_FOUND")
    const order = orderSnap.data() as DocumentData

    // Validaciones
    if (order.admin_view !== true) throw new Error("FORBIDDEN_ORDER")
  if (order.estado === ORDER_STATUS.COMPLETADOS) return // idempotente: ya completada
    const alreadyAssignedRef = order.asigned_rider_ref || order.assigned_rider_ref
    if (order.asigned === true && alreadyAssignedRef) return // idempotente

    // Validar rider
    const riderSnap = await tx.get(riderRef)
    if (!riderSnap.exists()) throw new Error("RIDER_NOT_FOUND")
    const rider = riderSnap.data() as DocumentData
    if (rider.active_rider !== true) throw new Error("RIDER_NOT_ACTIVE")

    // Crear doc en asigned_rider (todas las refs deben ser DocumentReference válidas)
    const newAssignedRef = doc(assignedCol)
    const clientRef = order.clienteref || order.cliente_ref || order.client_ref
    const clientAddressRef = order.client_address_ref || order.clientaddress_ref

    // Validar que existan referencias de cliente y dirección
    const isDocRef = (ref: any) => !!ref && typeof ref.id === "string"
    if (!isDocRef(clientRef) || !isDocRef(clientAddressRef)) {
      throw new Error("ORDER_CLIENT_REFS_MISSING")
    }
    tx.set(newAssignedRef, {
      client_ref: clientRef,
      client_address: clientAddressRef,
      order_ref: orderRef,
      rider_ref: riderRef,
      created_at: serverTimestamp(),
      status: "assigned",
    })

    // Actualizar orders
    tx.update(orderRef, {
      asigned_rider_ref: newAssignedRef,
      assigned_rider_ref: newAssignedRef, // compat
      asigned: true,
      rider_ref: riderRef,
      updated_at: serverTimestamp(),
    })

    // Actualizar rider
    tx.update(riderRef, {
      asigned_rider_ref: newAssignedRef,
      active_orders: increment(1),
    })
  })
}

/**
 * Marca una orden como "Completados" y limpia/actualiza referencias relacionadas en una sola transacción.
 */
export const completeOrderTransactional = async (orderId: string): Promise<void> => {
  const orderRef = doc(db, "orders", orderId)

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists()) throw new Error("ORDER_NOT_FOUND")
    const order = orderSnap.data() as DocumentData

    // Idempotencia
  if (order.estado === ORDER_STATUS.COMPLETADOS) return

    const deliveryPrice = Number(order.delivery_price ?? 0) || 0
    const clientRef = order.clienteref || order.cliente_ref || order.client_ref
    const riderRef = order.rider_ref

    // Actualizar order
    tx.update(orderRef, {
      estado: ORDER_STATUS.COMPLETADOS,
      activo: false,
      fecha_entrega: order.fecha_entrega ?? serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    // Limpiar cliente
    if (clientRef) {
      tx.update(clientRef, {
        chat_ref: deleteField(),
        rider_ref: deleteField(),
        orderref: deleteField(),
        activeorders: deleteField(),
      })
    }

    // Actualizar rider si existe
    if (riderRef) {
      const riderSnap = await tx.get(riderRef)
      if (riderSnap.exists()) {
        const rider = riderSnap.data() as DocumentData
        const currentActive = Number(rider.active_orders ?? 0)
        const riderUpdates: Record<string, any> = {
          asigned_rider_ref: deleteField(),
          number_deliverys: increment(1),
          earn: increment(deliveryPrice),
        }
        if (currentActive > 0) {
          riderUpdates.active_orders = increment(-1)
        }
        tx.update(riderRef, riderUpdates)
      }
    }
  })
}
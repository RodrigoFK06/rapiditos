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
  onSnapshot,
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
  // Compat: los campos pueden venir como cliente_ref o clienteref según origen
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
  console.log("[Service] assignRiderTransactional START", { orderId, riderRefPath })
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
    console.log("[Service][TX] assignRider -> read order:", { estado: order.estado, admin_view: order.admin_view, asigned: order.asigned })

    // Validaciones
    if (order.admin_view !== true) throw new Error("FORBIDDEN_ORDER")
  if (order.estado === ORDER_STATUS.COMPLETADOS) return // idempotente: ya completada
  const alreadyAssignedRef = order.asigned_rider_ref
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
  console.log("[Service] assignRiderTransactional COMMIT", { orderId })
}

/**
 * Marca una orden como "Completados" y limpia/actualiza referencias relacionadas en una sola transacción.
 */
export const completeOrderTransactional = async (orderId: string): Promise<void> => {
  console.log("[Service] completeOrderTransactional START", { orderId })
  const orderRef = doc(db, "orders", orderId)

  return runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists()) {
      console.error("[TX] order not found")
      return
    }
    const order = orderSnap.data() as DocumentData
    console.log("[TX] read order:", { estado: order.estado, admin_view: order.admin_view })

    // Idempotencia
    if (order.estado === ORDER_STATUS.COMPLETADOS) return

    const clientRef = (order as any).clienteref
    const riderRef = (order as any).rider_ref
    const delivery = Number((order as any).delivery_price) || 0

    console.log("[TX] refs:", {
      hasClient: !!(clientRef && (clientRef as any).path),
      hasRider: !!(riderRef && (riderRef as any).path),
      delivery,
    })

    // PRE-LECTURAS: leer rider antes de cualquier escritura para calcular nextActive
    let nextActive: number | undefined = undefined
    if (riderRef?.path) {
      const riderSnap = await tx.get(riderRef)
      const riderData = riderSnap.data() as any
      const currentActive = Number(riderData?.active_orders || 0)
      nextActive = Math.max(currentActive - 1, 0)
      console.log("[TX] pre-read rider active_orders:", { currentActive, nextActive })
    }

    // ESCRITURAS
    // Marcar orden
    tx.update(orderRef, {
      estado: ORDER_STATUS.COMPLETADOS,
  activo: true,
      fecha_entrega: (order as any).fecha_entrega ?? serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    console.log("[TX] scheduled order update")

    // Limpiar cliente SOLO si es DocumentReference
    if (clientRef?.path) {
      console.log("[TX] will update client:", clientRef.path)
      tx.update(clientRef, {
        chat_ref: deleteField(),
        rider_ref: deleteField(),
        orderref: deleteField(),
        activeorders: deleteField(),
      })
    } else {
      console.warn("[TX] clienteref missing or invalid, skipping user cleanup")
    }

    // Actualizar rider SOLO si es DocumentReference
    if (riderRef?.path) {
      console.log("[TX] will update rider:", riderRef.path)
      tx.update(riderRef, {
        asigned_rider_ref: deleteField(),
        number_deliverys: increment(1),
        active_orders: nextActive ?? undefined,
        earn: increment(delivery),
      })
    } else {
      console.warn("[TX] rider_ref missing, skipping rider counters")
    }

    console.log("[TX] all writes scheduled")
  })
    .then(() => {
      console.log("[Service] completeOrderTransactional COMMIT", { orderId })
    })
    .catch((err) => {
      console.error("[Service] completeOrderTransactional ERROR", (err as any)?.code, (err as any)?.message, err)
      throw err
    })
}

// ========================= REALTIME =========================
export const subscribeOrderById = (
  orderId: string,
  cb: (order: Order | null) => void
) => {
  const orderRef = doc(db, "orders", orderId)
  return onSnapshot(
    orderRef,
    (snap) => {
      if (!snap.exists()) return cb(null)
      try {
        const mapped = mapOrder(snap as unknown as DocumentSnapshot<DocumentData>)
        cb(mapped)
      } catch (e) {
        console.error("[Service] subscribeOrderById map error", e)
        cb({ id: snap.id, ...(snap.data() as any) } as Order)
      }
    },
    (error) => {
      console.error("[Service] subscribeOrderById ERROR", error?.code, error?.message, error)
      cb(null)
    }
  )
}

// Suscripción a un rider por referencia (para ver datos en vivo del repartidor asignado)
export const subscribeRiderByRef = (
  riderRef: DocumentReference,
  cb: (data: any | null) => void
) => {
  return onSnapshot(
    riderRef,
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (error) => {
      console.error("[Service] subscribeRiderByRef ERROR", error?.code, error?.message, error)
      cb(null)
    }
  )
}
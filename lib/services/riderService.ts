import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import type { Rider, AssignedRider } from "../types"

export const getRiderById = async (id: string): Promise<Rider | null> => {
  try {
    const riderDoc = await getDoc(doc(db, "rider", id))
    if (riderDoc.exists()) {
      return { id: riderDoc.id, ...riderDoc.data() } as Rider
    }
    return null
  } catch (error) {
    console.error("Error fetching rider:", error)
    return null
  }
}

export const getAllRiders = async (): Promise<Rider[]> => {
  try {
    const ridersSnapshot = await getDocs(collection(db, "rider"))
    return ridersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Rider)
  } catch (error) {
    console.error("Error fetching riders:", error)
    return []
  }
}

export const getActiveRiders = async (): Promise<Rider[]> => {
  try {
    const q = query(collection(db, "rider"), where("isActive", "==", true))
    const ridersSnapshot = await getDocs(q)
    return ridersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Rider)
  } catch (error) {
    console.error("Error fetching active riders:", error)
    return []
  }
}

export const updateRider = async (id: string, data: Partial<Rider>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "rider", id), data)
    return true
  } catch (error) {
    console.error("Error updating rider:", error)
    return false
  }
}

export const getAssignedOrdersByRider = async (riderId: string): Promise<AssignedRider[]> => {
  try {
    const q = query(collection(db, "asigned_rider"), where("rider_ref", "==", riderId))
    const assignmentsSnapshot = await getDocs(q)
    return assignmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AssignedRider)
  } catch (error) {
    console.error("Error fetching rider assignments:", error)
    return []
  }
}

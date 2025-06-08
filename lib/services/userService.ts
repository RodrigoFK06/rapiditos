import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import type { User } from "../types"

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", id))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User
    }
    return null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", role))
    const usersSnapshot = await getDocs(q)
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
  } catch (error) {
    console.error(`Error fetching ${role} users:`, error)
    return []
  }
}

export const updateUser = async (id: string, data: Partial<User>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "users", id), data)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    return false
  }
}

export const toggleUserStatus = async (id: string, isActive: boolean): Promise<boolean> => {
  return updateUser(id, { isActive })
}

import { doc, getDoc, getDocs, collection, query, where, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateUser, validateArray, safeParseUser, type ValidatedUser } from "@/lib/validations/runtime"
import type { User } from "@/lib/types"

/**
 * Obtiene un usuario por ID con validación runtime
 */
export const getUserByIdSafe = async (id: string): Promise<ValidatedUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", id))
    
    if (!userDoc.exists()) {
      return null
    }

    const rawData = { 
      uid: userDoc.id, 
      ...userDoc.data() 
    }

    // Validación segura
    const result = safeParseUser(rawData)
    
    if (result.success) {
      return result.data
    } else {
      console.error('Error validando usuario:', result.error.errors)
      // En lugar de fallar, loggear y retornar null
      console.warn(`Usuario ${id} tiene datos inválidos, saltando...`)
      return null
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    throw new Error(`No se pudo cargar el usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Obtiene todos los usuarios con validación
 */
export const getAllUsersSafe = async (): Promise<ValidatedUser[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    const rawUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))

    // Validar todos los usuarios, filtrando los inválidos
    const validUsers = validateArray(
      rawUsers,
      validateUser,
      'usuarios'
    )

    return validUsers
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error(`No se pudieron cargar los usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Obtiene usuarios por rol con validación
 */
export const getUsersByRoleSafe = async (role: string): Promise<ValidatedUser[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", role))
    const usersSnapshot = await getDocs(q)
    
    const rawUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))

    const validUsers = validateArray(
      rawUsers,
      validateUser,
      `usuarios con rol ${role}`
    )

    return validUsers
  } catch (error) {
    console.error(`Error fetching ${role} users:`, error)
    throw new Error(`No se pudieron cargar los usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Actualiza un usuario con validación previa
 */
export const updateUserSafe = async (id: string, data: Partial<User>): Promise<boolean> => {
  try {
    // Primero obtener el usuario actual
    const currentUser = await getUserByIdSafe(id)
    if (!currentUser) {
      throw new Error('Usuario no encontrado')
    }

    // Combinar datos actuales con nuevos datos
    const updatedData = { ...currentUser, ...data }

    // Validar datos combinados
    const validationResult = safeParseUser(updatedData)
    if (!validationResult.success) {
      throw new Error(`Datos inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }

    // Actualizar en Firestore
    await updateDoc(doc(db, "users", id), data)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

/**
 * Cambiar estado de usuario con validación
 */
export const toggleUserStatusSafe = async (id: string, isActive: boolean): Promise<boolean> => {
  return updateUserSafe(id, { isActive })
}

/**
 * Obtener usuario por referencia (path completo)
 */
export const getUserByRefSafe = async (refPath: string): Promise<ValidatedUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, refPath))
    
    if (!userDoc.exists()) {
      return null
    }

    const rawData = { 
      uid: userDoc.id, 
      ...userDoc.data() 
    }

    const result = safeParseUser(rawData)
    
    if (result.success) {
      return result.data
    } else {
      console.error('Error validando usuario por ref:', result.error.errors)
      throw new Error('Los datos del usuario no son válidos')
    }
  } catch (error) {
    console.error("Error fetching user by ref:", error)
    throw new Error(`No se pudo cargar el usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Mantener funciones originales para compatibilidad (deprecated)
export const getUserById = getUserByIdSafe
export const getAllUsers = getAllUsersSafe
export const getUsersByRole = getUsersByRoleSafe
export const updateUser = updateUserSafe
export const toggleUserStatus = toggleUserStatusSafe
export const getUserByRef = getUserByRefSafe

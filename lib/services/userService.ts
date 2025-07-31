import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  limit, 
  orderBy, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore"
import { db } from "../firebase"
import type { User } from "../types"
import { AppError, ErrorCode } from "../errors/AppError"

// Tipos para paginación
export interface UserQueryOptions {
  limit?: number
  role?: string
  orderByField?: 'display_name' | 'email' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
  lastDoc?: QueryDocumentSnapshot<DocumentData>
  searchTerm?: string
}

export interface PaginatedUsers {
  users: User[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
  total?: number
}

/**
 * 🔧 Mapea un documento de Firestore a User
 * Maneja la inconsistencia entre 'id' y 'uid'
 */
const mapFirestoreUser = (docSnap: QueryDocumentSnapshot<DocumentData>): User => {
  const data = docSnap.data()
  return {
    uid: docSnap.id, // Usar el ID del documento como uid
    id: docSnap.id,  // Mantener compatibilidad
    display_name: data.display_name || '',
    email: data.email || '',
    phone: data.phone || '',
    photo_url: data.photo_url || '',
    role: data.role || 'client',
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    ...data
  } as User
}

/**
 * 📄 Obtiene un usuario por ID específico
 * ✅ Manejo de errores mejorado
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    if (!id || id.trim() === '') {
      console.warn("ID de usuario vacío proporcionado")
      return null
    }

    const userDoc = await getDoc(doc(db, "users", id))
    
    if (!userDoc.exists()) {
      return null
    }
    
    return mapFirestoreUser(userDoc as QueryDocumentSnapshot<DocumentData>)
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw new Error(`Error al obtener usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * 📄 Obtiene usuario por referencia (path completo)
 * ✅ Usado en páginas de detalle
 */
export const getUserByRef = async (refPath: string): Promise<User | null> => {
  try {
    if (!refPath || refPath.trim() === '') {
      throw new Error("Referencia de usuario requerida")
    }

    const userDoc = await getDoc(doc(db, refPath))
    
    if (!userDoc.exists()) {
      return null
    }
    
    const data = userDoc.data()
    
    // Validar que los datos tienen los campos requeridos
    if (!data?.display_name || !data?.email || !data?.phone || !data?.role) {
      throw new Error("Datos de usuario incompletos")
    }
    
    return {
      uid: userDoc.id,
      ...data
    } as User
  } catch (error) {
    console.error("Error fetching user by ref:", error)
    throw new Error("No se pudo cargar la información del usuario")
  }
}

/**
 * 📋 Obtiene todos los usuarios con opciones de consulta
 * ✅ SOLUCIÓN PROBLEMA 1: Evita consultas compuestas sin índices
 * ✅ Implementa paginación para evitar sobrecargas
 * ✅ Permite filtrado simple sin índices complejos
 */
export const getAllUsers = async (options: UserQueryOptions = {}): Promise<PaginatedUsers> => {
  try {
    const {
      limit: queryLimit = 50, // Límite por defecto para evitar descargas masivas
      role,
      orderByField = 'display_name',
      orderDirection = 'asc',
      lastDoc,
      searchTerm
    } = options

    // 🔥 ESTRATEGIA 1: Query simple para evitar errores de índice
    let baseQuery = collection(db, "users")
    
    // Solo aplicamos el filtro más básico para evitar índices compuestos
    if (role && role !== 'all') {
      baseQuery = query(baseQuery, where("role", "==", role)) as any
    }
    
    // 🔥 ESTRATEGIA 2: Evitar orderBy + where que requiere índices complejos
    let finalQuery = baseQuery
    
    if (!searchTerm && !role) {
      // Solo ordenar cuando no hay filtros para evitar índices compuestos
      try {
        finalQuery = query(
          baseQuery,
          orderBy(orderByField, orderDirection),
          limit(queryLimit)
        ) as any
        
        if (lastDoc) {
          finalQuery = query(finalQuery, startAfter(lastDoc)) as any
        }
      } catch (orderError) {
        console.warn('Ordenamiento no disponible, usando query simple')
        finalQuery = query(baseQuery, limit(queryLimit)) as any
      }
    } else {
      // Para búsqueda o filtros, solo aplicar límite
      finalQuery = query(baseQuery, limit(queryLimit * 2)) as any // Más docs para filtrar
    }

    const snapshot = await getDocs(finalQuery)
    let users = snapshot.docs.map(mapFirestoreUser)

    // � ESTRATEGIA 3: Filtrado de búsqueda en memoria (evita índices complejos)
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim()
      users = users.filter(user => 
        user.display_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone.includes(term)
      )
      
      // Limitar resultados después del filtrado
      users = users.slice(0, queryLimit)
    }

    // 🔥 ESTRATEGIA 4: Ordenamiento en memoria si no se pudo hacer en Firestore
    if (searchTerm || role) {
      users.sort((a, b) => {
        if (orderByField === 'display_name') {
          const aVal = a.display_name || ''
          const bVal = b.display_name || ''
          return orderDirection === 'asc' 
            ? aVal.localeCompare(bVal, 'es')
            : bVal.localeCompare(aVal, 'es')
        }
        if (orderByField === 'email') {
          return orderDirection === 'asc' 
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email)
        }
        return 0
      })
    }

    const hasMore = snapshot.docs.length === queryLimit
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

    return {
      users,
      lastDoc: searchTerm ? null : newLastDoc, // No paginación en búsqueda
      hasMore: searchTerm ? false : hasMore,   // No paginación en búsqueda
      total: users.length
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    
    // 🔥 ESTRATEGIA 5: Manejo específico de errores de índice
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('🔥 Firebase Index Required - Falling back to simple query')
      
      // Fallback: Query más simple posible
      try {
        const fallbackQuery = query(collection(db, "users"), limit(options.limit || 50))
        const snapshot = await getDocs(fallbackQuery)
        let users = snapshot.docs.map(mapFirestoreUser)
        
        // Aplicar filtros en memoria
        if (options.role && options.role !== 'all') {
          users = users.filter(user => user.role === options.role)
        }
        
        if (options.searchTerm) {
          const searchLower = options.searchTerm.toLowerCase()
          users = users.filter(user =>
            user.display_name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.phone.includes(options.searchTerm!)
          )
        }
        
        return {
          users,
          lastDoc: null,
          hasMore: false,
          total: users.length
        }
      } catch (fallbackError) {
        throw new AppError(
          ErrorCode.FIREBASE_PERMISSION_DENIED,
          `Error de consulta Firebase: ${fallbackError instanceof Error ? fallbackError.message : 'Error desconocido'}`,
          "Error al cargar usuarios. Los datos pueden estar limitados."
        )
      }
    }
    
    throw new AppError(
      ErrorCode.FIREBASE_NETWORK_ERROR,
      `Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      "No se pudieron cargar los usuarios"
    )
  }
}

/**
 * 👥 Obtiene usuarios por rol específico
 * ✅ Query simple sin índices complejos
 */
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    if (!role || role.trim() === '') {
      throw new Error("Rol requerido para la consulta")
    }

    // Query simple - solo filtro por rol, sin ordenamiento para evitar índices
    const q = query(
      collection(db, "users"), 
      where("role", "==", role),
      limit(100) // Límite para evitar sobrecargas
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(mapFirestoreUser)
  } catch (error) {
    console.error(`Error fetching ${role} users:`, error)
    throw new Error(`Error al obtener usuarios con rol ${role}`)
  }
}

/**
 * ✏️ Actualiza un usuario
 * ✅ Validación de datos mejorada
 */
export const updateUser = async (id: string, data: Partial<User>): Promise<boolean> => {
  try {
    if (!id || id.trim() === '') {
      throw new Error("ID de usuario requerido para actualización")
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Datos de actualización requeridos")
    }

    // Limpiar datos undefined/null antes de enviar a Firestore
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
    )

    await updateDoc(doc(db, "users", id), cleanData)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error("Error al actualizar usuario")
  }
}

/**
 * 🔄 Cambia el estado activo/inactivo de un usuario
 * ✅ Acción específica y segura
 */
export const toggleUserStatus = async (id: string, isActive: boolean): Promise<boolean> => {
  try {
    return await updateUser(id, { isActive })
  } catch (error) {
    console.error("Error toggling user status:", error)
    throw new Error(`Error al ${isActive ? 'activar' : 'desactivar'} usuario`)
  }
}

/**
 * 🔍 Búsqueda de usuarios (simulada en el cliente)
 * ✅ Evita índices complejos de Firestore
 */
export const searchUsers = async (searchTerm: string, limit: number = 20): Promise<User[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return []
    }

    // Obtener más usuarios de los necesarios para poder filtrar
    const result = await getAllUsers({ 
      limit: Math.max(limit * 3, 100), // Obtener más para tener opciones al filtrar
      searchTerm: searchTerm.trim()
    })

    return result.users
  } catch (error) {
    console.error("Error searching users:", error)
    throw new Error("Error en la búsqueda de usuarios")
  }
}

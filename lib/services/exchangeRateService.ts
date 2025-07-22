import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  DocumentSnapshot,
  DocumentData 
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ExchangeRate } from "@/lib/types"

/**
 * Maps a Firestore document to ExchangeRate interface
 */
const mapExchangeRate = (docSnap: DocumentSnapshot<DocumentData>): ExchangeRate => {
  const data = docSnap.data() as DocumentData
  return {
    id: docSnap.id,
    base_currency: data.base_currency || "",
    target_currency: data.target_currency || "",
    rate: Number(data.rate) || 0,
    created_at: data.created_at?.toDate() || new Date(),
  }
}

/**
 * Retrieves all exchange rate documents from Firestore
 * @returns Promise<ExchangeRate[]> - Array of exchange rate documents
 */
export const getAllExchangeRates = async (): Promise<ExchangeRate[]> => {
  try {
    const exchangeRatesSnapshot = await getDocs(collection(db, "exchange_rate"))
    return exchangeRatesSnapshot.docs.map(mapExchangeRate)
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    throw new Error("Error al obtener las tasas de cambio")
  }
}

/**
 * Retrieves a specific exchange rate by ID
 * @param id - The document ID
 * @returns Promise<ExchangeRate | null> - The exchange rate document or null if not found
 */
export const getExchangeRateById = async (id: string): Promise<ExchangeRate | null> => {
  try {
    const exchangeRateDoc = await getDocs(collection(db, "exchange_rate"))
    const foundDoc = exchangeRateDoc.docs.find(doc => doc.id === id)
    
    if (foundDoc && foundDoc.exists()) {
      return mapExchangeRate(foundDoc)
    }
    return null
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    throw new Error("Error al obtener la tasa de cambio")
  }
}

/**
 * Updates only the rate field of an exchange rate document
 * @param id - The document ID to update
 * @param newRate - The new rate value (must be a positive number)
 * @returns Promise<boolean> - True if update was successful
 */
export const updateExchangeRate = async (id: string, newRate: number): Promise<boolean> => {
  try {
    // Validate rate input
    if (typeof newRate !== 'number' || newRate <= 0 || isNaN(newRate)) {
      throw new Error("La tasa debe ser un número positivo válido")
    }

    const exchangeRateRef = doc(db, "exchange_rate", id)
    
    // Only update the rate field
    await updateDoc(exchangeRateRef, {
      rate: newRate
    })
    
    return true
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al actualizar la tasa de cambio")
  }
}

/**
 * Validates if a rate value is valid
 * @param rate - The rate to validate
 * @returns boolean - True if rate is valid
 */
export const isValidRate = (rate: number | string): boolean => {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate
  return !isNaN(numRate) && numRate > 0 && isFinite(numRate)
}

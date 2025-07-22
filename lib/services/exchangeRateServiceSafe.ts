import { 
  getAllExchangeRates as getAllExchangeRatesBase,
  updateExchangeRate as updateExchangeRateBase,
  getExchangeRateById as getExchangeRateByIdBase
} from "./exchangeRateService"
import { safeParseExchangeRate } from "@/lib/validations/runtime"
import { ExchangeRate } from "@/lib/types"
import { AppError, ErrorCode, ErrorSeverity, throwValidationError } from "@/lib/errors/AppError"

export type ValidatedExchangeRate = ExchangeRate

/**
 * Obtiene todas las tasas de cambio con validación runtime
 */
export const getAllExchangeRatesSafe = async (): Promise<ValidatedExchangeRate[]> => {
  try {
    const exchangeRates = await getAllExchangeRatesBase()
    
    const validatedExchangeRates: ValidatedExchangeRate[] = []
    const errors: string[] = []

    for (const [index, exchangeRate] of exchangeRates.entries()) {
      const validation = safeParseExchangeRate(exchangeRate)
      
      if (validation.success) {
        validatedExchangeRates.push(validation.data as ValidatedExchangeRate)
      } else {
        errors.push(`ExchangeRate[${index}]: ${validation.error.message}`)
        console.warn(`Datos inválidos para ExchangeRate[${index}]:`, validation.error.issues)
      }
    }

    if (errors.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn(`Se encontraron ${errors.length} errores de validación en ExchangeRates`)
    }

    return validatedExchangeRates
  } catch (error) {
    throw new AppError(
      "Error al obtener tasas de cambio",
      ErrorCode.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error }
    )
  }
}

/**
 * Obtiene una tasa de cambio por ID con validación runtime
 */
export const getExchangeRateByIdSafe = async (id: string): Promise<ValidatedExchangeRate | null> => {
  try {
    const exchangeRate = await getExchangeRateByIdBase(id)
    
    if (!exchangeRate) {
      return null
    }

    const validation = safeParseExchangeRate(exchangeRate)
    
    if (!validation.success) {
      throwValidationError(
        `Datos inválidos para ExchangeRate con ID: ${id}`,
        "exchangeRate",
        exchangeRate
      )
    }

    return validation.data as ValidatedExchangeRate
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    
    throw new AppError(
      `Error al obtener tasa de cambio con ID: ${id}`,
      ErrorCode.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      { exchangeRateId: id, originalError: error }
    )
  }
}

/**
 * Actualiza una tasa de cambio con validación
 */
export const updateExchangeRateSafe = async (id: string, rate: number): Promise<boolean> => {
  try {
    // Validar que el rate sea válido
    if (typeof rate !== 'number' || rate <= 0 || !isFinite(rate)) {
      throwValidationError(
        "El valor de la tasa debe ser un número positivo válido",
        "rate",
        rate
      )
    }

    return await updateExchangeRateBase(id, rate)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    
    throw new AppError(
      `Error al actualizar tasa de cambio con ID: ${id}`,
      ErrorCode.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      { exchangeRateId: id, rate, originalError: error }
    )
  }
}

// Exportar servicios seguros como predeterminados
export const getAllExchangeRates = getAllExchangeRatesSafe
export const getExchangeRateById = getExchangeRateByIdSafe
export const updateExchangeRate = updateExchangeRateSafe

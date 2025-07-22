import { create } from "zustand"
import { ExchangeRate } from "@/lib/types"
import { 
  getAllExchangeRates, 
  updateExchangeRate 
} from "@/lib/services/exchangeRateService"

interface ExchangeRateState {
  exchangeRates: ExchangeRate[]
  isLoading: boolean
  error: string | null
  fetchExchangeRates: () => Promise<void>
  updateExchangeRateData: (id: string, rate: number) => Promise<boolean>
  getExchangeRateById: (id: string) => ExchangeRate | undefined
}

export const useExchangeRateStore = create<ExchangeRateState>((set, get) => ({
  exchangeRates: [],
  isLoading: false,
  error: null,

  fetchExchangeRates: async () => {
    set({ isLoading: true, error: null })
    try {
      const exchangeRates = await getAllExchangeRates()
      set({ exchangeRates, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar tasas de cambio"
      set({ error: errorMessage, isLoading: false })
      console.error("Error fetching exchange rates:", error)
    }
  },

  updateExchangeRateData: async (id: string, rate: number) => {
    try {
      const success = await updateExchangeRate(id, rate)
      
      if (success) {
        // Actualizar el estado local optimísticamente
        set((state) => ({
          exchangeRates: state.exchangeRates.map((exchangeRate) =>
            exchangeRate.id === id ? { ...exchangeRate, rate } : exchangeRate
          ),
        }))
        return true
      }
      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar tasa de cambio"
      set({ error: errorMessage })
      console.error("Error updating exchange rate:", error)
      return false
    }
  },

  getExchangeRateById: (id: string) => {
    const { exchangeRates } = get()
    return exchangeRates.find((exchangeRate) => exchangeRate.id === id)
  },
}))

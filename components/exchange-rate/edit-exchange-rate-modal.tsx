"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ExchangeRate } from "@/lib/types"
import { exchangeRateSchema, ExchangeRateFormData } from "@/lib/validations/schemas"
import { useUpdateExchangeRate } from "@/hooks/queries/useExchangeRateQueries"

interface EditExchangeRateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchangeRate: ExchangeRate
}

export function EditExchangeRateModal({ 
  open, 
  onOpenChange, 
  exchangeRate 
}: EditExchangeRateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateExchangeRateMutation = useUpdateExchangeRate()

  const form = useForm<ExchangeRateFormData>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      rate: exchangeRate.rate,
    },
  })

  // Resetear form cuando cambia el exchange rate
  useEffect(() => {
    form.reset({
      rate: exchangeRate.rate,
    })
  }, [exchangeRate.id, form])

  const onSubmit = async (data: ExchangeRateFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await updateExchangeRateMutation.mutateAsync({
        id: exchangeRate.id,
        rate: data.rate,
      })
      
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // El error ya se maneja en el hook de mutación
      console.error("Error updating exchange rate:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset({
      rate: exchangeRate.rate,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Tasa de Cambio</DialogTitle>
          <DialogDescription>
            Modifica la tasa de cambio de {exchangeRate.base_currency} a{" "}
            {exchangeRate.target_currency}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Moneda Base
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {exchangeRate.base_currency}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Moneda Objetivo
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {exchangeRate.target_currency}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de Cambio *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.01"
                      max="10000"
                      placeholder="115.5000"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-muted-foreground">
              Tasa actual: <span className="font-mono">{exchangeRate.rate.toFixed(4)}</span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

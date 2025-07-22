# Módulo Exchange Rate

Este módulo gestiona las **tasas de cambio** para el panel administrativo de Rapiditos. Permite visualizar y actualizar las tasas de cambio entre diferentes monedas.

## 🚀 Características

- ✅ **Visualización completa** de todas las tasas de cambio
- ✅ **Edición inline** del campo `rate` únicamente
- ✅ **Validación en tiempo real** con Zod schemas
- ✅ **React Query** para cache inteligente y actualizaciones optimistas
- ✅ **Zustand store** alternativo (opcional)
- ✅ **TypeScript** con tipado estricto
- ✅ **Error handling** robusto con rollback automático
- ✅ **UI/UX profesional** con shadcn/ui

## 📁 Estructura de archivos

```
📦 Exchange Rate Module
├── 🗃️ Types & Schemas
│   ├── lib/types.ts                          # Interfaz ExchangeRate
│   ├── lib/validations/schemas.ts            # Schemas de formulario (Zod)
│   └── lib/validations/runtime.ts            # Validación runtime
├── 🛠️ Services
│   ├── lib/services/exchangeRateService.ts   # Servicio base Firebase
│   └── lib/services/exchangeRateServiceSafe.ts # Servicio con validación
├── 🔄 State Management
│   ├── hooks/queries/useExchangeRateQueries.ts # React Query hooks
│   └── lib/stores/useExchangeRateStore.ts     # Zustand store (opcional)
├── 🎨 Components
│   ├── components/exchange-rate/edit-exchange-rate-modal.tsx # Modal de edición
│   └── lib/table/columns.tsx                 # Columnas de la tabla
├── 📄 Pages
│   ├── app/exchange-rates/page.tsx           # Página principal (React Query)
│   └── app/exchange-rates/page-with-zustand.tsx # Versión alternativa (Zustand)
└── 🧭 Navigation
    └── components/layout/sidebar.tsx         # Menú lateral actualizado
```

## 🔗 Firestore Schema

**Colección:** `exchange_rate`

```typescript
{
  id: "GtgowVL6YqBbTCEZoSV7",           // ID del documento
  base_currency: "USD",                  // Moneda base (string)
  target_currency: "VES",                // Moneda objetivo (string)
  rate: 115.5,                          // Tasa (number) ✅ EDITABLE
  created_at: Timestamp                  // Fecha de creación (readonly)
}
```

## 🎯 Funcionalidades

### ✅ Permitidas
- **Ver** todas las tasas de cambio
- **Editar** únicamente el campo `rate`
- **Buscar** por moneda base
- **Actualizar** datos en tiempo real

### ❌ Restricciones
- **NO** se pueden crear nuevos registros
- **NO** se pueden eliminar registros
- **NO** se pueden editar `base_currency`, `target_currency`, o `created_at`

## 🛠️ APIs y Hooks

### React Query (Recomendado)

```typescript
import { useExchangeRates, useUpdateExchangeRate } from '@/hooks/queries/useExchangeRateQueries'

// Obtener todas las tasas
const { data: exchangeRates, isLoading, error } = useExchangeRates()

// Actualizar una tasa
const updateMutation = useUpdateExchangeRate()
updateMutation.mutate({ id: "123", rate: 120.5 })
```

### Zustand Store (Alternativo)

```typescript
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore'

const { 
  exchangeRates, 
  isLoading, 
  fetchExchangeRates, 
  updateExchangeRateData 
} = useExchangeRateStore()
```

### Services

```typescript
import { getAllExchangeRates, updateExchangeRate } from '@/lib/services/exchangeRateService'

// Obtener todas las tasas
const rates = await getAllExchangeRates()

// Actualizar una tasa
const success = await updateExchangeRate("id123", 118.75)
```

## 🎨 Componentes UI

### ExchangeRatesPage
**Ruta:** `/exchange-rates`  
**Componente principal** con tabla, KPIs y modal de edición.

### EditExchangeRateModal
**Modal de edición** con validación en tiempo real y UX optimizada.

### Columnas de tabla
**Columnas memoizadas** con formateo de monedas y acciones.

## 🔒 Validaciones

### Esquemas Zod

```typescript
// Validación de formulario
const exchangeRateSchema = z.object({
  rate: z.coerce.number()
    .positive("La tasa debe ser un número positivo")
    .min(0.01, "La tasa debe ser mayor a 0.01")
    .max(10000, "La tasa no puede exceder 10,000")
})

// Validación de actualización
const updateExchangeRateSchema = z.object({
  id: z.string().min(1, "ID requerido"),
  rate: z.coerce.number().positive().min(0.01).max(10000)
})
```

### Validación en Runtime

```typescript
import { safeParseExchangeRate } from '@/lib/validations/runtime'

const validation = safeParseExchangeRate(firebaseData)
if (!validation.success) {
  console.error("Datos inválidos:", validation.error)
}
```

## 🚨 Manejo de Errores

- **Actualizaciones optimistas** con rollback automático
- **Toasts informativos** para éxito/error
- **Error boundaries** para errores inesperados
- **Validación en runtime** para datos de Firebase
- **Logs estructurados** para debugging

## 🎨 Características UI/UX

- **KPI Cards** con estadísticas en tiempo real
- **Tabla responsiva** con búsqueda y ordenamiento
- **Modal elegante** con validación inline
- **Loading states** y skeletons
- **Iconografía consistente** (DollarSign, TrendingUp)
- **Tipografía monoespaciada** para números
- **Colores semánticos** (verde/azul para máx/mín)

## 📱 Responsividad

- **Mobile-first** design
- **Grid adaptativo** para KPIs (1→2→4 columnas)
- **Modal responsive** con breakpoints
- **Tabla scrolleable** horizontalmente

## ⚡ Performance

- **Memoización** de columnas y callbacks
- **Cache inteligente** (5 min stale, 10 min garbage collection)
- **Actualizaciones optimistas** para UX instantánea
- **Lazy loading** de componentes pesados
- **Debounced search** para búsquedas

## 🔧 Configuración

### Agregar al sidebar
Ya está configurado en `components/layout/sidebar.tsx`:

```typescript
{
  label: "Tasas de Cambio",
  icon: DollarSign,
  href: "/exchange-rates",
  active: pathname === "/exchange-rates" || pathname.startsWith("/exchange-rates/"),
}
```

### Permisos
- Requiere rol **admin** (heredado del layout)
- Validación de autenticación Firebase

## 🧪 Testing

Para testing futuro, considera:

```typescript
// Unit tests
- exchangeRateService.test.ts
- useExchangeRateQueries.test.ts
- EditExchangeRateModal.test.ts

// Integration tests  
- ExchangeRatesPage.test.tsx

// E2E tests
- exchange-rates.spec.ts
```

## 🚀 Uso

1. **Navegar** a `/exchange-rates` desde el sidebar
2. **Visualizar** todas las tasas en la tabla
3. **Hacer clic** en el botón de editar (icono lápiz)
4. **Modificar** el valor de la tasa
5. **Confirmar** para guardar con validación automática

## 🔄 Próximas mejoras

- [ ] Historial de cambios de tasas
- [ ] Notificaciones push para cambios críticos
- [ ] API externa para tasas en tiempo real
- [ ] Gráficos de tendencias temporales
- [ ] Exportación a Excel/PDF
- [ ] Configuración de alertas por umbrales

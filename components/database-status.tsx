import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Database, RefreshCw, Leaf } from 'lucide-react'

interface DatabaseStatusProps {
  productsError?: string | null
  salesError?: string | null
  cashError?: string | null
  transfersError?: string | null
  productsUsingFallback?: boolean
  salesUsingFallback?: boolean
  cashUsingFallback?: boolean
  transfersUsingFallback?: boolean
  onRefresh?: () => void
}

export function DatabaseStatus({
  productsError,
  salesError,
  cashError,
  transfersError,
  productsUsingFallback,
  salesUsingFallback,
  cashUsingFallback,
  transfersUsingFallback,
  onRefresh
}: DatabaseStatusProps) {
  const hasErrors = productsError || salesError || cashError || transfersError
  const isUsingFallback = productsUsingFallback || salesUsingFallback || cashUsingFallback || transfersUsingFallback

  if (!hasErrors && !isUsingFallback) {
    return (
      <Card className="border-veggie-200 bg-gradient-to-r from-veggie-50 to-leaf-50">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle className="h-5 w-5 text-veggie-600" />
          <div>
            <p className="text-sm font-medium text-veggie-800">Base de datos conectada</p>
            <p className="text-xs text-veggie-600">Todas las tablas están funcionando correctamente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-leaf-300 bg-gradient-to-r from-leaf-50 to-veggie-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-leaf-600" />
            <CardTitle className="text-sm text-leaf-800">
              Base de datos no configurada
            </CardTitle>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-8 border-veggie-300 text-veggie-700 hover:bg-veggie-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-leaf-700">
            Las tablas de Supabase no están creadas. La aplicación funciona con datos de ejemplo.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-leaf-700">Productos:</span>
              <Badge variant={productsUsingFallback ? "secondary" : "default"} 
                     className={productsUsingFallback ? "bg-leaf-100 text-leaf-800" : "bg-veggie-500 text-white text-xs"}>
                {productsUsingFallback ? "Ejemplo" : "Conectado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-leaf-700">Ventas:</span>
              <Badge variant={salesUsingFallback ? "secondary" : "default"} 
                     className={salesUsingFallback ? "bg-leaf-100 text-leaf-800" : "bg-veggie-500 text-white text-xs"}>
                {salesUsingFallback ? "Ejemplo" : "Conectado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-leaf-700">Caja:</span>
              <Badge variant={cashUsingFallback ? "secondary" : "default"} 
                     className={cashUsingFallback ? "bg-leaf-100 text-leaf-800" : "bg-veggie-500 text-white text-xs"}>
                {cashUsingFallback ? "Ejemplo" : "Conectado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-leaf-700">Traslados:</span>
              <Badge variant={transfersUsingFallback ? "secondary" : "default"} 
                     className={transfersUsingFallback ? "bg-leaf-100 text-leaf-800" : "bg-veggie-500 text-white text-xs"}>
                {transfersUsingFallback ? "Ejemplo" : "Conectado"}
              </Badge>
            </div>
          </div>

          <div className="bg-gradient-to-r from-leaf-100 to-veggie-100 p-3 rounded-md border border-leaf-200">
            <p className="text-xs font-medium text-leaf-800 mb-2 flex items-center gap-1">
              <Leaf className="h-3 w-3" />
              Para configurar la base de datos:
            </p>
            <ol className="list-decimal list-inside text-xs text-leaf-700 space-y-1">
              <li>Ve a tu proyecto de Supabase</li>
              <li>Ejecuta el script "00-setup-database.sql" en el SQL Editor</li>
              <li>Haz clic en "Reintentar" o recarga la página</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

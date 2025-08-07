"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, Edit, Trash2, ArrowRightLeft, Calculator, Eye, Filter, Calendar, Leaf, Sprout, LayoutDashboard, Box, ReceiptText, Wallet, Repeat2 } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import { useSales } from '@/hooks/use-sales'
import { useCashMovements } from '@/hooks/use-cash-movements'
import { useBalanceTransfers } from '@/hooks/use-balance-transfers'
import { supabase } from '@/lib/supabase'
import { DatabaseStatus } from '@/components/database-status'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from '@/components/ui/sidebar'
import { SidebarMenuButtonWrapper } from '@/components/sidebar-menu-button-wrapper' // Importar el nuevo componente

export default function InventoryApp() {
  // Hooks de datos
  const { 
    products, 
    loading: productsLoading, 
    error: productsError, 
    usingFallback: productsUsingFallback, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    refetch: refetchProducts
  } = useProducts()

  const { 
    sales, 
    loading: salesLoading, 
    error: salesError, 
    usingFallback: salesUsingFallback, 
    createSale, 
    fetchSales, 
    getSalesByDateRange,
    refetch: refetchSales
  } = useSales()

  const { 
    cashMovements, 
    loading: cashLoading, 
    error: cashError, 
    usingFallback: cashUsingFallback, 
    createCashMovement, 
    fetchCashMovements,
    refetch: refetchCashMovements
  } = useCashMovements()

  const { 
    balanceTransfers, 
    loading: transfersLoading, 
    error: transfersError, 
    usingFallback: transfersUsingFallback, 
    createBalanceTransfer,
    refetch: refetchBalanceTransfers
  } = useBalanceTransfers()

  // Eliminar la llamada a useSidebar aquí, se moverá al wrapper
  // const { isMobile, setOpenMobile } = useSidebar()

  // Verificar si hay errores de conexión
  const hasConnectionErrors = productsError || salesError || cashError || transfersError
  const isUsingFallback = productsUsingFallback || salesUsingFallback || cashUsingFallback || transfersUsingFallback

  // Estados para filtros
  const [salesDateFilter, setSalesDateFilter] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [cashDateFilter, setCashDateFilter] = useState("")
  const [showCashDateFilter, setShowCashDateFilter] = useState(false)

  // Estado para la pestaña activa (ahora controlada por el sidebar)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Estados para formularios
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // Formularios
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    min_stock: ""
  })

  const [saleForm, setSaleForm] = useState({
    product_id: "",
    quantity: ""
  })

  const [cashForm, setCashForm] = useState({
    type: "income" as 'income' | 'expense',
    amount: "",
    description: ""
  })

  const [transferForm, setTransferForm] = useState({
    from_date: "",
    to_date: "",
    amount: "",
    description: ""
  })

  const handleRefreshDatabase = async () => {
    await Promise.all([
      refetchProducts(),
      refetchSales(),
      refetchCashMovements(),
      refetchBalanceTransfers()
    ])
  }

  // Funciones para productos
  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.stock) return

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        min_stock: parseInt(productForm.min_stock) || 0
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await createProduct(productData)
      }

      resetProductForm()
      setIsProductDialogOpen(false)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      min_stock: product.min_stock.toString()
    })
    setIsProductDialogOpen(true)
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id)
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      min_stock: ""
    })
    setEditingProduct(null)
  }

  // Funciones para ventas
  const handleSale = async () => {
    if (!saleForm.product_id || !saleForm.quantity) return

    const product = products.find(p => p.id === saleForm.product_id)
    if (!product || product.stock < parseInt(saleForm.quantity)) return

    try {
      const quantity = parseInt(saleForm.quantity)
      const total = product.price * quantity

      // Crear venta
      await createSale({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total,
        sale_date: new Date().toISOString().split('T')[0]
      })

      // Actualizar stock
      await updateProduct(product.id, { stock: product.stock - quantity })

      // Agregar movimiento de caja
      await createCashMovement({
        type: 'income',
        amount: total,
        description: `Venta: ${product.name} x${quantity}`,
        movement_date: new Date().toISOString().split('T')[0]
      })

      setSaleForm({ product_id: "", quantity: "" })
      setIsSaleDialogOpen(false)
    } catch (error) {
      console.error('Error processing sale:', error)
    }
  }

  // Funciones para caja
  const handleCashMovement = async () => {
    if (!cashForm.amount || !cashForm.description) return

    try {
      await createCashMovement({
        type: cashForm.type,
        amount: parseFloat(cashForm.amount),
        description: cashForm.description,
        movement_date: new Date().toISOString().split('T')[0]
      })

      setCashForm({ type: 'income', amount: "", description: "" })
      setIsCashDialogOpen(false)
    } catch (error) {
      console.error('Error creating cash movement:', error)
    }
  }

  // Filtrar movimientos de caja por fecha
  const handleCashDateFilter = async () => {
    if (cashDateFilter) {
      await fetchCashMovements(cashDateFilter)
    } else {
      await fetchCashMovements()
    }
  }

  const clearCashDateFilter = async () => {
    setCashDateFilter("")
    await fetchCashMovements()
  }

  // Funciones para traslado de saldos
  const handleBalanceTransfer = async () => {
    if (!transferForm.from_date || !transferForm.to_date || !transferForm.amount) return

    try {
      await createBalanceTransfer({
        from_date: transferForm.from_date,
        to_date: transferForm.to_date,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description,
        transfer_date: new Date().toISOString().split('T')[0]
      })

      setTransferForm({ from_date: "", to_date: "", amount: "", description: "" })
      setIsTransferDialogOpen(false)
    } catch (error) {
      console.error('Error creating balance transfer:', error)
    }
  }

  // Filtrar ventas por fecha
  const handleDateFilter = async () => {
    if (salesDateFilter) {
      await fetchSales(salesDateFilter)
    } else {
      await fetchSales()
    }
  }

  const clearDateFilter = async () => {
    setSalesDateFilter("")
    await fetchSales()
  }

  // Cálculos
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock <= p.min_stock).length
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  
  const today = new Date().toISOString().split('T')[0]
  const todaySales = sales.filter(s => s.sale_date === today)
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  
  // Usar los movimientos filtrados si hay filtro, sino los de hoy
  const displayCashMovements = cashDateFilter 
    ? cashMovements.filter(m => m.movement_date === cashDateFilter)
    : cashMovements.filter(m => m.movement_date === today)

  const todayIncome = displayCashMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0)
  const todayExpenses = displayCashMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0)
  const cashBalance = todayIncome - todayExpenses

  if (productsLoading || salesLoading || cashLoading || transfersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-veggie-50 via-leaf-50 to-forest-50">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Sprout className="h-8 w-8 text-veggie-500 animate-pulse" />
              <div className="text-lg text-veggie-700">Cargando...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* Sidebar abierto por defecto en desktop */}
      <Sidebar collapsible="icon"> {/* Collapsible a icono en desktop, offcanvas en mobile */}
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-veggie-500 to-leaf-500 rounded-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-veggie-700 to-forest-700 bg-clip-text text-transparent group-data-[state=collapsed]:hidden">
              VeggieBurger
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButtonWrapper
                    isActive={activeTab === "dashboard"}
                    onClick={() => setActiveTab("dashboard")}
                    tooltip="Dashboard"
                    icon={LayoutDashboard}
                  >
                    Dashboard
                  </SidebarMenuButtonWrapper>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButtonWrapper
                    isActive={activeTab === "products"}
                    onClick={() => setActiveTab("products")}
                    tooltip="Productos"
                    icon={Box}
                  >
                    Productos
                  </SidebarMenuButtonWrapper>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButtonWrapper
                    isActive={activeTab === "sales"}
                    onClick={() => setActiveTab("sales")}
                    tooltip="Ventas"
                    icon={ReceiptText}
                  >
                    Ventas
                  </SidebarMenuButtonWrapper>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButtonWrapper
                    isActive={activeTab === "cash"}
                    onClick={() => setActiveTab("cash")}
                    tooltip="Caja Diaria"
                    icon={Wallet}
                  >
                    Caja Diaria
                  </SidebarMenuButtonWrapper>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButtonWrapper
                    isActive={activeTab === "transfers"}
                    onClick={() => setActiveTab("transfers")}
                    tooltip="Traslados"
                    icon={Repeat2}
                  >
                    Traslados
                  </SidebarMenuButtonWrapper>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <p className="text-xs text-veggie-600 group-data-[state=collapsed]:hidden">© 2024 VeggieBurger</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/80 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 text-veggie-700 hover:bg-veggie-100" />
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-veggie-700 to-forest-700 bg-clip-text text-transparent">
            VeggieBurger Inventory
          </h1>
        </header>

        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            {(hasConnectionErrors || isUsingFallback) && (
              <div className="mb-6">
                <DatabaseStatus
                  productsError={productsError}
                  salesError={salesError}
                  cashError={cashError}
                  transfersError={transfersError}
                  productsUsingFallback={productsUsingFallback}
                  salesUsingFallback={salesUsingFallback}
                  cashUsingFallback={cashUsingFallback}
                  transfersUsingFallback={transfersUsingFallback}
                  onRefresh={handleRefreshDatabase}
                />
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-white to-veggie-50 border-veggie-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-veggie-700">Total Productos</CardTitle>
                    <Package className="h-4 w-4 text-veggie-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-veggie-800">{totalProducts}</div>
                    <p className="text-xs text-veggie-600">
                      {lowStockProducts} con stock bajo
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white to-leaf-50 border-leaf-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-leaf-700">Ventas Hoy</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-leaf-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-leaf-800">{todaySales.length}</div>
                    <p className="text-xs text-leaf-600">
                      ${todayRevenue.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white to-forest-50 border-forest-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-forest-700">Caja Hoy</CardTitle>
                    <DollarSign className="h-4 w-4 text-forest-500" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashBalance >= 0 ? 'text-forest-800' : 'text-red-600'}`}>
                      ${cashBalance.toLocaleString()}
                    </div>
                    <p className="text-xs text-forest-600">
                      Ingresos: ${todayIncome.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white to-veggie-50 border-veggie-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-veggie-700">Ventas Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-veggie-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-veggie-800">${totalSales.toLocaleString()}</div>
                    <p className="text-xs text-veggie-600">
                      {sales.length} transacciones
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="bg-white/80 backdrop-blur-sm border-veggie-200">
                  <CardHeader>
                    <CardTitle className="text-veggie-700 flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      Productos con Stock Bajo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {products.filter(p => p.stock <= p.min_stock).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium text-red-800">{product.name}</p>
                            <p className="text-sm text-red-600">Stock: {product.stock}</p>
                          </div>
                          <Badge variant="destructive" className="bg-red-500">Bajo</Badge>
                        </div>
                      ))}
                      {lowStockProducts === 0 && (
                        <div className="text-center py-8">
                          <Leaf className="h-12 w-12 text-veggie-300 mx-auto mb-2" />
                          <p className="text-veggie-600">¡Todo el stock está en buen nivel!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-leaf-200">
                  <CardHeader>
                    <CardTitle className="text-leaf-700 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Últimas Ventas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sales.slice(-5).reverse().map(sale => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-leaf-50 to-veggie-50 border border-leaf-200 rounded-lg">
                          <div>
                            <p className="font-medium text-leaf-800">{sale.product_name}</p>
                            <p className="text-sm text-leaf-600">
                              {sale.quantity} x ${sale.unit_price.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-forest-700">${sale.total.toLocaleString()}</p>
                            <p className="text-xs text-forest-500">{sale.sale_date}</p>
                          </div>
                        </div>
                      ))}
                      {sales.length === 0 && (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-leaf-300 mx-auto mb-2" />
                          <p className="text-leaf-600">No hay ventas registradas</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Productos */}
            <TabsContent value="products" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-veggie-700">Gestión de Productos</h2>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetProductForm()} className="bg-veggie-500 hover:bg-veggie-600 text-white w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-veggie-700">
                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-veggie-700">Nombre</Label>
                        <Input
                          id="name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description" className="text-veggie-700">Descripción</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price" className="text-veggie-700">Precio</Label>
                          <Input
                            id="price"
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="stock" className="text-veggie-700">Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="category" className="text-veggie-700">Categoría</Label>
                          <Input
                            id="category"
                            value={productForm.category}
                            onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="minStock" className="text-veggie-700">Stock Mínimo</Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={productForm.min_stock}
                            onChange={(e) => setProductForm({...productForm, min_stock: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsProductDialogOpen(false)} className="border-veggie-300 text-veggie-700">
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProduct} className="bg-veggie-500 hover:bg-veggie-600 text-white">
                        {editingProduct ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border-veggie-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-veggie-50 to-leaf-50">
                          <TableHead className="text-veggie-700">Nombre</TableHead>
                          <TableHead className="text-veggie-700 hidden sm:table-cell">Categoría</TableHead>
                          <TableHead className="text-veggie-700">Precio</TableHead>
                          <TableHead className="text-veggie-700">Stock</TableHead>
                          <TableHead className="text-veggie-700 hidden md:table-cell">Estado</TableHead>
                          <TableHead className="text-veggie-700">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="hover:bg-veggie-50/50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-veggie-800">{product.name}</p>
                                <p className="text-sm text-veggie-600 sm:hidden">{product.category}</p>
                                <p className="text-xs text-veggie-500 line-clamp-1">{product.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-leaf-700">{product.category}</TableCell>
                            <TableCell className="font-medium text-forest-700">${product.price.toLocaleString()}</TableCell>
                            <TableCell className="text-veggie-700">{product.stock}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={product.stock <= product.min_stock ? "destructive" : "default"}
                                     className={product.stock <= product.min_stock ? "bg-red-500" : "bg-veggie-500"}>
                                {product.stock <= product.min_stock ? "Stock Bajo" : "Normal"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 sm:gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  className="border-leaf-300 text-leaf-600 hover:bg-leaf-50 p-1 sm:p-2"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 p-1 sm:p-2"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ventas */}
            <TabsContent value="sales" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-veggie-700">Registro de Ventas</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className="border-leaf-300 text-leaf-600 hover:bg-leaf-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar por Fecha
                  </Button>
                  <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-veggie-500 hover:bg-veggie-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Venta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-veggie-700">Registrar Venta</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="product" className="text-veggie-700">Producto</Label>
                          <Select value={saleForm.product_id} onValueChange={(value) => setSaleForm({...saleForm, product_id: value})}>
                            <SelectTrigger className="border-veggie-200 focus:border-veggie-500">
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.filter(p => p.stock > 0).map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - Stock: {product.stock} - ${product.price.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantity" className="text-veggie-700">Cantidad</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={saleForm.quantity}
                            onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                        {saleForm.product_id && saleForm.quantity && (
                          <div className="p-4 bg-gradient-to-r from-veggie-50 to-leaf-50 rounded-lg border border-veggie-200">
                            <p className="font-medium text-veggie-800 mb-2">Resumen de Venta:</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-veggie-700">Producto: {products.find(p => p.id === saleForm.product_id)?.name}</p>
                              <p className="text-veggie-700">Cantidad: {saleForm.quantity}</p>
                              <p className="text-veggie-700">Precio unitario: ${products.find(p => p.id === saleForm.product_id)?.price.toLocaleString()}</p>
                              <p className="font-bold text-forest-800">
                                Total: ${((products.find(p => p.id === saleForm.product_id)?.price || 0) * parseInt(saleForm.quantity || "0")).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSaleDialogOpen(false)} className="border-veggie-300 text-veggie-700">
                          Cancelar
                        </Button>
                        <Button onClick={handleSale} className="bg-veggie-500 hover:bg-veggie-600 text-white">
                          Registrar Venta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {showDateFilter && (
                <Card className="bg-white/80 backdrop-blur-sm border-leaf-200">
                  <CardHeader>
                    <CardTitle className="text-leaf-700">Filtrar Ventas por Fecha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor="dateFilter" className="text-veggie-700">Fecha</Label>
                        <Input
                          id="dateFilter"
                          type="date"
                          value={salesDateFilter}
                          onChange={(e) => setSalesDateFilter(e.target.value)}
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={handleDateFilter} className="bg-leaf-500 hover:bg-leaf-600 text-white flex-1 sm:flex-none">
                          <Filter className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                        <Button variant="outline" onClick={clearDateFilter} className="border-veggie-300 text-veggie-700 flex-1 sm:flex-none">
                          Limpiar
                        </Button>
                      </div>
                    </div>
                    {salesDateFilter && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-veggie-100 to-leaf-100 rounded-lg border border-veggie-200">
                        <p className="text-sm text-veggie-700 font-medium">
                          Mostrando ventas del: <strong>{salesDateFilter}</strong>
                        </p>
                        <p className="text-sm text-veggie-600">
                          Total de ventas filtradas: {sales.length} | 
                          Monto total: ${sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white/80 backdrop-blur-sm border-veggie-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-veggie-50 to-leaf-50">
                          <TableHead className="text-veggie-700">Fecha</TableHead>
                          <TableHead className="text-veggie-700">Producto</TableHead>
                          <TableHead className="text-veggie-700 hidden sm:table-cell">Cantidad</TableHead>
                          <TableHead className="text-veggie-700 hidden md:table-cell">Precio Unit.</TableHead>
                          <TableHead className="text-veggie-700">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale) => (
                          <TableRow key={sale.id} className="hover:bg-veggie-50/50">
                            <TableCell className="text-veggie-600">{sale.sale_date}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-veggie-800">{sale.product_name}</p>
                                <p className="text-xs text-veggie-600 sm:hidden">
                                  {sale.quantity} x ${sale.unit_price.toLocaleString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-leaf-700">{sale.quantity}</TableCell>
                            <TableCell className="hidden md:table-cell text-forest-700">${sale.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="font-medium text-veggie-800">${sale.total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {sales.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-veggie-600 py-8">
                              <ShoppingCart className="h-12 w-12 text-veggie-300 mx-auto mb-2" />
                              No hay ventas registradas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Caja Diaria */}
            <TabsContent value="cash" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-veggie-700">Caja Diaria</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowCashDateFilter(!showCashDateFilter)}
                    className="border-leaf-300 text-leaf-600 hover:bg-leaf-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar por Fecha
                  </Button>
                  <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-veggie-500 hover:bg-veggie-600 text-white w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Movimiento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-veggie-700">Registrar Movimiento de Caja</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="type" className="text-veggie-700">Tipo</Label>
                          <Select value={cashForm.type} onValueChange={(value: 'income' | 'expense') => setCashForm({...cashForm, type: value})}>
                            <SelectTrigger className="border-veggie-200 focus:border-veggie-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Ingreso</SelectItem>
                              <SelectItem value="expense">Egreso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="amount" className="text-veggie-700">Monto</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={cashForm.amount}
                            onChange={(e) => setCashForm({...cashForm, amount: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="text-veggie-700">Descripción</Label>
                          <Textarea
                            id="description"
                            value={cashForm.description}
                            onChange={(e) => setCashForm({...cashForm, description: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCashDialogOpen(false)} className="border-veggie-300 text-veggie-700">
                          Cancelar
                        </Button>
                        <Button onClick={handleCashMovement} className="bg-veggie-500 hover:bg-veggie-600 text-white">
                          Registrar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {showCashDateFilter && (
                <Card className="bg-white/80 backdrop-blur-sm border-leaf-200">
                  <CardHeader>
                    <CardTitle className="text-leaf-700">Filtrar Movimientos por Fecha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor="cashDateFilter" className="text-veggie-700">Fecha</Label>
                        <Input
                          id="cashDateFilter"
                          type="date"
                          value={cashDateFilter}
                          onChange={(e) => setCashDateFilter(e.target.value)}
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={handleCashDateFilter} className="bg-leaf-500 hover:bg-leaf-600 text-white flex-1 sm:flex-none">
                          <Filter className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                        <Button variant="outline" onClick={clearCashDateFilter} className="border-veggie-300 text-veggie-700 flex-1 sm:flex-none">
                          Limpiar
                        </Button>
                      </div>
                    </div>
                    {cashDateFilter && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-veggie-100 to-leaf-100 rounded-lg border border-veggie-200">
                        <p className="text-sm text-veggie-700 font-medium">
                          Mostrando movimientos del: <strong>{cashDateFilter}</strong>
                        </p>
                        <p className="text-sm text-veggie-600">
                          Ingresos: ${displayCashMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0).toLocaleString()} | 
                          Egresos: ${displayCashMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0).toLocaleString()} | 
                          Balance: ${(displayCashMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0) - displayCashMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0)).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-white to-veggie-50 border-veggie-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-veggie-600 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Ingresos Hoy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-veggie-800">${todayIncome.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-red-50 border-red-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 rotate-180" />
                      Egresos Hoy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">${todayExpenses.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-forest-50 border-forest-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-forest-700 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Saldo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashBalance >= 0 ? 'text-forest-800' : 'text-red-600'}`}>
                      ${cashBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border-veggie-200">
                <CardHeader>
                  <CardTitle className="text-veggie-700 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {cashDateFilter ? `Movimientos del ${cashDateFilter}` : 'Movimientos de Hoy'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-veggie-50 to-leaf-50">
                          <TableHead className="text-veggie-700">Tipo</TableHead>
                          <TableHead className="text-veggie-700">Descripción</TableHead>
                          <TableHead className="text-veggie-700">Monto</TableHead>
                          <TableHead className="text-veggie-700 hidden sm:table-cell">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayCashMovements.slice().reverse().map((movement) => (
                          <TableRow key={movement.id} className="hover:bg-veggie-50/50">
                            <TableCell>
                              <Badge variant={movement.type === 'income' ? 'default' : 'destructive'}
                                     className={movement.type === 'income' ? "bg-veggie-500" : "bg-red-500"}>
                                {movement.type === 'income' ? 'Ingreso' : 'Egreso'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-veggie-700">{movement.description}</TableCell>
                            <TableCell className={movement.type === 'income' ? 'text-veggie-600 font-medium' : 'text-red-600 font-medium'}>
                              {movement.type === 'income' ? '+' : '-'}${movement.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-veggie-600">{movement.movement_date}</TableCell>
                          </TableRow>
                        ))}
                        {displayCashMovements.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-veggie-600 py-8">
                              <Calculator className="h-12 w-12 text-veggie-300 mx-auto mb-2" />
                              {cashDateFilter ? `No hay movimientos registrados el ${cashDateFilter}` : 'No hay movimientos registrados hoy'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Traslado de Saldos */}
            <TabsContent value="transfers" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-veggie-700">Traslado de Saldos</h2>
                <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-veggie-500 hover:bg-veggie-600 text-white w-full sm:w-auto">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Nuevo Traslado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-veggie-700">Registrar Traslado de Saldo</DialogTitle>
                      <DialogDescription className="text-veggie-600">
                        Trasladar saldo de una fecha a otra para ajustes contables
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fromDate" className="text-veggie-700">Fecha Origen</Label>
                          <Input
                            id="fromDate"
                            type="date"
                            value={transferForm.from_date}
                            onChange={(e) => setTransferForm({...transferForm, from_date: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="toDate" className="text-veggie-700">Fecha Destino</Label>
                          <Input
                            id="toDate"
                            type="date"
                            value={transferForm.to_date}
                            onChange={(e) => setTransferForm({...transferForm, to_date: e.target.value})}
                            className="border-veggie-200 focus:border-veggie-500"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="transferAmount" className="text-veggie-700">Monto</Label>
                        <Input
                          id="transferAmount"
                          type="number"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="transferDescription" className="text-veggie-700">Descripción</Label>
                        <Textarea
                          id="transferDescription"
                          value={transferForm.description}
                          onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                          placeholder="Motivo del traslado..."
                          className="border-veggie-200 focus:border-veggie-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)} className="border-veggie-300 text-veggie-700">
                        Cancelar
                      </Button>
                      <Button onClick={handleBalanceTransfer} className="bg-veggie-500 hover:bg-veggie-600 text-white">
                        Registrar Traslado
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border-veggie-200">
                <CardHeader>
                  <CardTitle className="text-veggie-700 flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Historial de Traslados
                  </CardTitle>
                  <CardDescription className="text-veggie-600">
                    Registro de todos los traslados de saldos realizados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-veggie-50 to-leaf-50">
                          <TableHead className="text-veggie-700">Fecha Registro</TableHead>
                          <TableHead className="text-veggie-700 hidden sm:table-cell">Fecha Origen</TableHead>
                          <TableHead className="text-veggie-700 hidden sm:table-cell">Fecha Destino</TableHead>
                          <TableHead className="text-veggie-700">Monto</TableHead>
                          <TableHead className="text-veggie-700 hidden md:table-cell">Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceTransfers.slice().reverse().map((transfer) => (
                          <TableRow key={transfer.id} className="hover:bg-veggie-50/50">
                            <TableCell className="text-veggie-600">{transfer.transfer_date}</TableCell>
                            <TableCell className="hidden sm:table-cell text-leaf-700">{transfer.from_date}</TableCell>
                            <TableCell className="hidden sm:table-cell text-leaf-700">{transfer.to_date}</TableCell>
                            <TableCell className="font-medium text-forest-700">${transfer.amount.toLocaleString()}</TableCell>
                            <TableCell className="hidden md:table-cell text-veggie-600">{transfer.description}</TableCell>
                          </TableRow>
                        ))}
                        {balanceTransfers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-veggie-600 py-8">
                              <ArrowRightLeft className="h-12 w-12 text-veggie-300 mx-auto mb-2" />
                              No hay traslados registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-leaf-200">
                <CardHeader>
                  <CardTitle className="text-leaf-700 flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    Información sobre Traslados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-leaf-700">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-veggie-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Los traslados de saldos permiten mover montos entre diferentes fechas</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-leaf-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Útil para correcciones contables y ajustes de períodos</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-forest-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Cada traslado queda registrado con fecha y descripción</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-veggie-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Los traslados no afectan el stock de productos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

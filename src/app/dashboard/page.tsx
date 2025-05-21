 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, AlertTriangle, CreditCard, DollarSign, Loader2 } from 'lucide-react'

// Color scheme constants
const COLORS = {
  primary: 'bg-blue-500',
  primaryLight: 'bg-blue-400',
  secondary: 'bg-purple-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
  textPrimary: 'text-gray-800',
  textSecondary: 'text-gray-600',
  border: 'border-gray-200',
  chartLine: '#6366f1', // indigo-500
  chartBar: '#8b5cf6', // violet-500
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingPayouts: 0
  })
  
  const [recentSales, setRecentSales] = useState<{date: string; sales: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch products data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')

      if (productsError) throw productsError

      // Calculate stats
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = ordersData?.length || 0
      const totalProducts = productsData?.length || 0
      const lowStockItems = productsData?.filter(product => product.stock_quantity < 10).length || 0
      const pendingPayouts = ordersData?.filter(order => order.payment_status === 'pending').length || 0

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockItems,
        pendingPayouts
      })

      // Generate sales data for the last 7 days
      const salesByDate = generateSalesData(ordersData || [])
      setRecentSales(salesByDate)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate sales data for the last 7 days
  function generateSalesData(orders: any[]): {date: string; sales: number}[] {
    const salesMap = new Map<string, number>()
    const today = new Date()
    
    // Initialize last 7 days with 0 sales
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      salesMap.set(dateString, 0)
    }
    
    // Aggregate sales by date
    orders.forEach(order => {
      if (!order.created_at) return
      
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      if (salesMap.has(orderDate)) {
        salesMap.set(orderDate, (salesMap.get(orderDate) || 0) + (order.total_amount || 0))
      }
    })
    
    // Convert to array of objects
    return Array.from(salesMap.entries()).map(([date, sales]) => ({
      date,
      sales
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 p-4 rounded-lg border border-red-200 bg-red-50">
          {error}
          <button 
            onClick={fetchDashboardData}
            className="mt-2 block text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalProducts}</div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="text-amber-600">{stats.lowStockItems} items</span> low in stock
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.pendingPayouts}</div>
            <div className="text-xs text-gray-500 mt-1">
              Requires your attention
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</div>
            <div className="text-xs text-gray-500 mt-1">
              Products need restocking
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentSales}
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#d1d5db"
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#d1d5db"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`$${value}`, 'Sales']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={COLORS.chartLine}
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: COLORS.chartLine }}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="/dashboard/products" 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-center"
                >
                  <Package className="h-8 w-8 mb-2 text-blue-600" />
                  <span className="font-medium text-gray-700">Add New Product</span>
                  <span className="text-xs text-gray-500 mt-1">Manage inventory</span>
                </a>
                <a 
                  href="/dashboard/orders" 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors flex flex-col items-center justify-center text-center"
                >
                  <ShoppingCart className="h-8 w-8 mb-2 text-purple-600" />
                  <span className="font-medium text-gray-700">View Orders</span>
                  <span className="text-xs text-gray-500 mt-1">Process new orders</span>
                </a>
                <a 
                  href="/dashboard/stock-alerts" 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-amber-50 transition-colors flex flex-col items-center justify-center text-center"
                >
                  <AlertTriangle className="h-8 w-8 mb-2 text-amber-600" />
                  <span className="font-medium text-gray-700">Stock Alerts</span>
                  <span className="text-xs text-gray-500 mt-1">{stats.lowStockItems} items need attention</span>
                </a>
                <a 
                  href="/dashboard/payouts" 
                  className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors flex flex-col items-center justify-center text-center"
                >
                  <CreditCard className="h-8 w-8 mb-2 text-green-600" />
                  <span className="font-medium text-gray-700">Request Payout</span>
                  <span className="text-xs text-gray-500 mt-1">Withdraw your earnings</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional chart - Monthly Revenue */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recentSales}
                margin={{
                  top: 5,
                  right: 20,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#d1d5db"
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#d1d5db"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                />
                <Bar
                  dataKey="sales"
                  fill={COLORS.chartBar}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
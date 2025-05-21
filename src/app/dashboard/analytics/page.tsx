 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp, Loader2, AlertCircle } from 'lucide-react'

// Type definitions
interface SalesData {
  month: string;
  sales: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface ProductData {
  name: string;
  sales: number;
}

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
  chartColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899']
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growthRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    fetchAnalyticsData()
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  async function fetchAnalyticsData() {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch all necessary data in parallel
      const [
        ordersResponse,
        categoriesResponse,
        productsResponse,
        previousMonthData
      ] = await Promise.all([
        supabase.from('orders').select('*, order_items(*, products(*, categories(*)))'),
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .lt('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString())
      ])

      const ordersError = ordersResponse.error
      const categoriesError = categoriesResponse.error
      const productsError = productsResponse.error
      const previousMonthError = previousMonthData.error

      if (ordersError || categoriesError || productsError || previousMonthError) {
        throw ordersError || categoriesError || productsError || previousMonthError
      }

      const orders = ordersResponse.data || []
      const categories = categoriesResponse.data || []
      const products = productsResponse.data || []
      const previousMonthOrders = previousMonthData.data || []

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      // Calculate growth rate compared to previous month
      const prevMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const growthRate = prevMonthRevenue > 0 
        ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 100

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        growthRate: parseFloat(growthRate.toFixed(1))
      })

      // Generate monthly sales data
      const monthlySales = generateMonthlySales(orders)
      setSalesData(monthlySales)

      // Generate category distribution
      const categoryDistribution = generateCategoryDistribution(orders, categories)
      setCategoryData(categoryDistribution)

      // Generate top products
      const topSellingProducts = generateTopProducts(orders)
      setTopProducts(topSellingProducts)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate monthly sales data
  function generateMonthlySales(orders: any[]): SalesData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const salesByMonth: Record<string, number> = {}
    
    // Initialize all months with 0 sales
    months.forEach(month => {
      salesByMonth[month] = 0
    })
    
    // Aggregate sales by month
    orders.forEach(order => {
      if (!order.created_at) return
      
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short' })
      salesByMonth[month] = (salesByMonth[month] || 0) + (order.total_amount || 0)
    })
    
    // Convert to array of objects for the current year
    const currentYear = new Date().getFullYear()
    return months.map(month => ({
      month,
      sales: salesByMonth[month]
    })).filter((_, index) => {
      // Only show months up to current month
      const currentMonth = new Date().getMonth()
      return index <= currentMonth
    })
  }

  // Helper function to generate category distribution
  function generateCategoryDistribution(orders: any[], categories: any[]): CategoryData[] {
    const categorySales: Record<string, number> = {}
    
    // Initialize all categories with 0 sales
    categories.forEach(category => {
      categorySales[category.id] = 0
    })
    
    // Aggregate sales by category
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const categoryId = item.products?.categories?.id
        if (categoryId) {
          categorySales[categoryId] = (categorySales[categoryId] || 0) + (item.price * item.quantity || 0)
        }
      })
    })
    
    // Convert to array of objects and sort by sales
    return categories
      .map(category => ({
        name: category.name,
        value: categorySales[category.id] || 0
      }))
      .filter(item => item.value > 0) // Only show categories with sales
      .sort((a, b) => b.value - a.value) // Sort by sales descending
  }

  // Helper function to generate top products
  function generateTopProducts(orders: any[]): ProductData[] {
    const productSales: Record<string, { name: string; sales: number }> = {}
    
    // Aggregate sales by product
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id
        const productName = item.products?.name || `Product ${productId}`
        const saleAmount = item.price * item.quantity || 0
        
        if (productSales[productId]) {
          productSales[productId].sales += saleAmount
        } else {
          productSales[productId] = {
            name: productName,
            sales: saleAmount
          }
        }
      })
    })
    
    // Convert to array and sort by sales
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales) // Sort by sales descending
      .slice(0, 10) // Get top 10 products
  }
  
  // Custom label for pie chart that's responsive
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (windowWidth < 768) return null
    return `${name} ${(percent * 100).toFixed(0)}%`
  }
  
  // Responsive product names for bar chart
  const getProductName = (name: string): string => {
    if (windowWidth < 640) {
      return name.length > 10 ? `${name.substring(0, 8)}...` : name
    }
    return name
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 p-4 rounded-lg border border-red-200 bg-red-50 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button 
            onClick={fetchAnalyticsData}
            className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Sales Analytics</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              {stats.growthRate >= 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{stats.growthRate}%</span> from last month
                </>
              ) : (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-red-500 transform rotate-180" />
                  <span className="text-red-500">{stats.growthRate}%</span> from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.avgOrderValue > 0 ? (
                <>Avg. order: ${stats.avgOrderValue.toFixed(2)}</>
              ) : (
                <>No orders yet</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {categoryData.length > 0 ? (
                <>${categoryData[0].value.toLocaleString()} in sales</>
              ) : (
                <>No category data</>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="w-full flex justify-between sm:justify-start sm:w-auto overflow-x-auto bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="sales" 
            className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Sales Trends
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Top Products
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg text-gray-800">Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: windowWidth < 640 ? 0 : 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12, fill: '#6b7280' }} 
                      stroke="#d1d5db"
                    />
                    <YAxis 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12, fill: '#6b7280' }} 
                      width={windowWidth < 640 ? 30 : 40}
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
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke={COLORS.chartLine}
                      activeDot={{ r: 6, fill: COLORS.chartLine }} 
                      strokeWidth={windowWidth < 640 ? 1.5 : 2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg text-gray-800">Sales by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={windowWidth >= 768}
                      outerRadius={windowWidth < 640 ? 70 : 100}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderPieLabel}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS.chartColors[index % COLORS.chartColors.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`$${value}`, 'Sales']}
                    />
                    <Legend 
                      layout={windowWidth < 768 ? "horizontal" : "vertical"} 
                      verticalAlign={windowWidth < 768 ? "bottom" : "middle"}
                      align={windowWidth < 768 ? "center" : "right"}
                      wrapperStyle={windowWidth < 768 ? {} : { right: 0 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg text-gray-800">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts.map(product => ({
                      ...product,
                      name: getProductName(product.name)
                    }))}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 10,
                      left: windowWidth < 640 ? 60 : 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12, fill: '#6b7280' }} 
                      stroke="#d1d5db"
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12, fill: '#6b7280' }}
                      width={windowWidth < 640 ? 60 : 100}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
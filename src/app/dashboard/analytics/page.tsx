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

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    fetchAnalyticsData()
    
    // Add responsive window size listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  async function fetchAnalyticsData() {
    setLoading(true)
    
    try {
      // In a real app, these would be actual queries to your Supabase database
      // For now, using dummy data
      
      // Monthly sales data
      const monthlySales = [
        { month: 'Jan', sales: 4000 },
        { month: 'Feb', sales: 3000 },
        { month: 'Mar', sales: 5000 },
        { month: 'Apr', sales: 2780 },
        { month: 'May', sales: 1890 },
        { month: 'Jun', sales: 2390 },
      ]
      
      // Category distribution
      const categories = [
        { name: 'Electronics', value: 400 },
        { name: 'Clothing', value: 300 },
        { name: 'Books', value: 200 },
        { name: 'Home', value: 278 },
        { name: 'Beauty', value: 189 },
      ]
      
      // Top selling products
      const products = [
        { name: 'Wireless Earbuds', sales: 120 },
        { name: 'Smart Watch', sales: 98 },
        { name: 'Bluetooth Speaker', sales: 86 },
        { name: 'Laptop Stand', sales: 72 },
        { name: 'Phone Case', sales: 65 },
      ]
      
      setSalesData(monthlySales)
      setCategoryData(categories)
      setTopProducts(products)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  
  // Custom label for pie chart that's responsive
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    // On mobile, don't show labels directly on the pie
    if (windowWidth < 768) return null
    
    return `${name} ${(percent * 100).toFixed(0)}%`
  }
  
  // Responsive product names for bar chart
  const getProductName = (name: string): string => {
    if (windowWidth < 640) {
      // Truncate names on very small screens
      return name.length > 10 ? `${name.substring(0, 8)}...` : name
    }
    return name
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics data...</div>
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Analytics</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,780.00</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+12.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$43.25</div>
            <p className="text-xs text-muted-foreground">+4.5% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="w-full flex justify-between sm:justify-start sm:w-auto overflow-x-auto">
          <TabsTrigger value="sales" className="flex-1 sm:flex-none">Sales Trends</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 sm:flex-none">Categories</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 sm:flex-none">Top Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Monthly Sales</CardTitle>
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: windowWidth < 640 ? 10 : 12 }} />
                    <YAxis tick={{ fontSize: windowWidth < 640 ? 10 : 12 }} width={windowWidth < 640 ? 30 : 40} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8" 
                      activeDot={{ r: 6 }} 
                      strokeWidth={windowWidth < 640 ? 1.5 : 2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Sales by Category</CardTitle>
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
          <Card>
            <CardHeader className="pb-0 sm:pb-2">
              <CardTitle className="text-base sm:text-lg">Top Selling Products</CardTitle>
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12 }} 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: windowWidth < 640 ? 10 : 12 }}
                      width={windowWidth < 640 ? 60 : 100}
                    />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8884d8" />
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

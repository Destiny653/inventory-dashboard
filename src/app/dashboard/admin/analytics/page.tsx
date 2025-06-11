'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { format, subDays } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils' 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [ordersData, setOrdersData] = useState<any[]>([])
  const [productsData, setProductsData] = useState<any[]>([])
  const [customersData, setCustomersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [vendorFilter, setVendorFilter] = useState('all')

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, timeframe, vendorFilter])

  async function fetchAnalyticsData() {
    try {
      setLoading(true)
      
      // Fetch sales data
      const { data: sales } = await supabase
        .from('completed_sales')
        .select('*')
        .gte('transaction_date', dateRange?.from?.toISOString())
        .lte('transaction_date', dateRange?.to?.toISOString())

      // Fetch orders data
      const { data: orders } = await supabase
        .from('completed_orders')
        .select('*')
        .gte('completed_at', dateRange?.from?.toISOString())
        .lte('completed_at', dateRange?.to?.toISOString())

      // Fetch products data
      const { data: products } = await supabase
        .from('products')
        .select('*')

      // Fetch customers data
      const { data: customers } = await supabase
        .from('user_profiles')
        .select('*')

      // Process data for charts
      const processedSales = processSalesData(sales || [])
      const processedOrders = processOrdersData(orders || [])
      const processedProducts = processProductsData(products || [])
      const processedCustomers = processCustomersData(customers || [])

      setSalesData(processedSales)
      setOrdersData(processedOrders)
      setProductsData(processedProducts)
      setCustomersData(processedCustomers)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  function processSalesData(data: any[]) {
    // Group by day and calculate totals
    const dailyData: Record<string, any> = {}
    
    data.forEach(sale => {
      const date = format(new Date(sale.transaction_date), 'yyyy-MM-dd')
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total: 0,
          count: 0
        }
      }
      dailyData[date].total += sale.total
      dailyData[date].count += 1
    })
    
    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  function processOrdersData(data: any[]) {
    // Group by status
    const statusCounts: Record<string, number> = {}
    
    data.forEach(order => {
      const status = order.order_data.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }

  function processProductsData(data: any[]) {
    // Top 5 products by stock
    return data
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        value: product.stock_quantity
      }))
  }

  function processCustomersData(data: any[]) {
    // Group by signup month
    const monthlyData: Record<string, number> = {}
    
    data.forEach(customer => {
      // Assuming created_at exists in user_profiles
      const month = format(new Date(customer.created_at || new Date()), 'MMM yyyy')
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })
    
    return Object.entries(monthlyData).map(([name, value]) => ({ name, value }))
  }

  function handleTimeframeChange(value: string) {
    setTimeframe(value)
    const today = new Date()
    
    switch (value) {
      case '7d':
        setDateRange({
          from: subDays(today, 7),
          to: today
        })
        break
      case '30d':
        setDateRange({
          from: subDays(today, 30),
          to: today
        })
        break
      case '90d':
        setDateRange({
          from: subDays(today, 90),
          to: today
        })
        break
      case 'ytd':
        setDateRange({
          from: new Date(today.getFullYear(), 0, 1),
          to: today
        })
        break
      default:
        setDateRange(undefined)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {timeframe === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {/* Would populate with actual vendors */}
              <SelectItem value="vendor1">Vendor 1</SelectItem>
              <SelectItem value="vendor2">Vendor 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Sales" fill="#8884d8" />
                  <Bar dataKey="count" name="Transaction Count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Stock Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Stock</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={productsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Stock Quantity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="New Customers" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesData.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              from {salesData.reduce((sum, item) => sum + (item.count || 0), 0)} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersData.reduce((sum, item) => sum + (item.value || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {ordersData.find(item => item.name === 'delivered')?.value || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productsData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {productsData.reduce((sum, item) => sum + (item.value || 0), 0)} in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customersData.reduce((sum, item) => sum + (item.value || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{customersData[customersData.length - 1]?.value || 0} this month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
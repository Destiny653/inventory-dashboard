'use client'

import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Printer, Eye, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MoreVertical, UserPlus, FileText, Loader2, Edit, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Vendor {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    created_at: string;
    role?: string;
    avatar_url?: string;
    status?: string;
    products_count?: number;
    total_sales?: number;
}

interface VendorSale {
    id: string;
    transaction_date: string;
    customer_name: string;
    total: number;
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    payment_method: string;
    staff_id: string;
}

export default function AdminVendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
    const [vendorSales, setVendorSales] = useState<VendorSale[]>([])
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isSalesLoading, setIsSalesLoading] = useState(false)
    const [isViewingSales, setIsViewingSales] = useState(false)
    const [isEditingVendor, setIsEditingVendor] = useState(false)
    const [vendorToDelete, setVendorToDelete] = useState<string | null>(null)
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchVendors()
    }, [])

    useEffect(() => {
        filterVendors()
    }, [vendors, searchTerm, statusFilter])

    async function fetchVendors() {
        try {
            setLoading(true)

            if (!supabaseAdmin) {
                toast.error('Admin client not configured.')
                return
            }

            const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

            if (authError) {
                console.error('Error fetching vendors:', authError)
                toast.error('Failed to fetch vendors')
                return
            }

            const vendorUsers: Vendor[] = authUsers.users
                .filter(user => user.user_metadata?.role === 'vendor')
                .map(user => ({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'N/A',
                    phone: user.phone || 'N/A',
                    created_at: user.created_at,
                    role: user.user_metadata?.role || 'vendor',
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                    status: user.user_metadata?.status || 'active',
                    products_count: user.user_metadata?.products_count || 0,
                    total_sales: user.user_metadata?.total_sales || 0
                }))

            setVendors(vendorUsers)
            setFilteredVendors(vendorUsers)
        } catch (error) {
            console.error('Error fetching vendors:', error)
            toast.error('Failed to fetch vendors')
        } finally {
            setLoading(false)
        }
    }

    async function fetchVendorSales(vendorId: string) {
        try {
            setIsSalesLoading(true)
            const { data, error } = await supabase
                .from('completed_sales')
                .select('*')
                .eq('staff_id', vendorId)
                .order('transaction_date', { ascending: false })

            if (error) throw error

            setVendorSales(data || [])
        } catch (error) {
            console.error('Error fetching vendor sales:', error)
            toast.error('Failed to fetch vendor sales')
        } finally {
            setIsSalesLoading(false)
        }
    }

    async function deleteVendor() {
        if (!vendorToDelete || !supabaseAdmin) return

        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(vendorToDelete)

            if (error) throw error

            toast.success('Vendor deleted successfully')
            fetchVendors()
        } catch (error) {
            console.error('Error deleting vendor:', error)
            toast.error('Failed to delete vendor')
        } finally {
            setVendorToDelete(null)
            setIsDeleteAlertOpen(false)
        }
    }

    async function deleteSale() {
        if (!saleToDelete) return

        try {
            const { error } = await supabase
                .from('completed_sales')
                .delete()
                .eq('id', saleToDelete)

            if (error) throw error

            toast.success('Sale deleted successfully')
            if (selectedVendor) {
                fetchVendorSales(selectedVendor.id)
            }
        } catch (error) {
            console.error('Error deleting sale:', error)
            toast.error('Failed to delete sale')
        } finally {
            setSaleToDelete(null)
        }
    }

    async function updateVendorStatus(vendorId: string, status: string) {
        try {
            setIsUpdatingStatus(true)

            if (!supabaseAdmin) {
                toast.error('Admin client not configured.')
                return
            }

            const { error } = await supabaseAdmin.auth.admin.updateUserById(vendorId, {
                user_metadata: { status }
            })

            if (error) throw error

            toast.success(`Vendor status updated to ${status}`)
            fetchVendors()
        } catch (error) {
            console.error('Error updating vendor status:', error)
            toast.error('Failed to update vendor status')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    function filterVendors() {
        let filtered = [...vendors]

        if (searchTerm) {
            filtered = filtered.filter(vendor =>
                vendor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(vendor => vendor.status === statusFilter)
        }

        setFilteredVendors(filtered)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>
            case 'suspended':
                return <Badge variant="destructive">Suspended</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const viewVendorSales = (vendor: Vendor) => {
        setSelectedVendor(vendor)
        fetchVendorSales(vendor.id)
        setIsViewingSales(true)
    }

    const openEditVendor = (vendor: Vendor) => {
        setSelectedVendor(vendor)
        setIsEditingVendor(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Vendors Management</h1>
                <div className="flex items-center space-x-2">
                    <Link href={'/dashboard/admin/settings'}>
                    <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Vendor
                    </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>Vendors List</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Input
                                    placeholder="Search vendors..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-10 px-3 pr-8 py-2 rounded-md border border-gray-300 bg-white text-gray-700 appearance-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No vendors found matching your criteria
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVendors.map((vendor) => (
                                        <TableRow key={vendor.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={vendor.avatar_url} />
                                                        <AvatarFallback>
                                                            {vendor.full_name?.charAt(0) || 'V'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{vendor.full_name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {vendor.products_count || 0} products
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{vendor.email}</TableCell>
                                            <TableCell>{vendor.phone}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger>
                                                        <div className="flex items-center">
                                                            {getStatusBadge(vendor.status)}
                                                            <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className='bg-white'>
                                                        <DropdownMenuItem
                                                            onClick={() => updateVendorStatus(vendor.id, 'active')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <span className="text-green-600">Active</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => updateVendorStatus(vendor.id, 'inactive')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <span className="text-gray-600">Inactive</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <span className="text-red-600">Suspended</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell>{formatDate(vendor.created_at)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => viewVendorSales(vendor)}
                                                >
                                                    {formatCurrency(vendor.total_sales || 0)}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className='bg-white'>
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => viewVendorSales(vendor)}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            View Sales
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setVendorToDelete(vendor.id)
                                                                setIsDeleteAlertOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Vendor Sales Dialog */}
            <Dialog open={isViewingSales} onOpenChange={setIsViewingSales}>
                <DialogContent className="w-[55vw] max-h-[90vh] flex flex-col bg-white rounded-lg shadow-xl p-0 overflow-hidden box-border">
                    <DialogHeader className="border-b p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage src={selectedVendor?.avatar_url} />
                                    <AvatarFallback>
                                        {selectedVendor?.full_name?.charAt(0) || 'V'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                                        {selectedVendor?.full_name}'s Sales
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 mt-1 text-sm sm:text-base">
                                        <span className="font-medium text-gray-800">{vendorSales.length}</span> sales totaling{' '}
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(vendorSales.reduce((sum, sale) => sum + sale.total, 0))}
                                        </span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {isSalesLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 flex-1">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                            <p className="mt-4 text-gray-600">Loading sales data...</p>
                        </div>
                    ) : vendorSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 flex-1">
                            <FileText className="h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No sales found</h3>
                            <p className="mt-1 text-sm text-gray-500">This vendor hasn't made any sales yet.</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 px-4 sm:px-6 overflow-x-auto">
                            <div className="space-y-6 py-2">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-[]">
                                    <Card className="bg-blue-50 border-blue-100">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-800">Total Sales</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl sm:text-2xl font-bold text-blue-900">
                                                {formatCurrency(vendorSales.reduce((sum, sale) => sum + sale.total, 0))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-green-50 border-green-100">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-green-800">Average Sale</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl sm:text-2xl font-bold text-green-900">
                                                {formatCurrency(vendorSales.reduce((sum, sale) => sum + sale.total, 0) / vendorSales.length)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-purple-50 border-purple-100">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-purple-800">Total Items Sold</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl sm:text-2xl font-bold text-purple-900">
                                                {vendorSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sales Table */}
                                <Card className="border-gray-200 overflow-x-auto">
                                    <Table className="min-w-[600px]">
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="w-[120px]">Date</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Payment</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vendorSales.map((sale) => (
                                                <TableRow key={sale.id} className="hover:bg-gray-50/50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span className="whitespace-nowrap">{formatDate(sale.transaction_date)}</span>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {new Date(sale.transaction_date).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium truncate max-w-[120px]">
                                                            {sale.customer_name || 'Anonymous'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                                                    <span>{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</span>
                                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                                                                <div className="p-4">
                                                                    <h4 className="font-medium mb-2">Items in this sale</h4>
                                                                    <div className="space-y-3">
                                                                        {sale.items.map((item, index) => (
                                                                            <div key={index} className="flex justify-between items-center">
                                                                                <div>
                                                                                    <p className="font-medium">{item.name}</p>
                                                                                    <p className="text-sm text-gray-500">
                                                                                        {item.quantity} × {formatCurrency(item.price)}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="font-medium">
                                                                                    {formatCurrency(item.price * item.quantity)}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between font-medium">
                                                                        <span>Total</span>
                                                                        <span>{formatCurrency(sale.total)}</span>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-green-600 whitespace-nowrap">
                                                        {formatCurrency(sale.total)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "capitalize whitespace-nowrap",
                                                                sale.payment_method === 'cash' ? 'bg-green-50 text-green-700' :
                                                                    sale.payment_method === 'card' ? 'bg-blue-50 text-blue-700' :
                                                                        'bg-gray-50 text-gray-700'
                                                            )}
                                                        >
                                                            {sale.payment_method}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="border-t p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{vendorSales.length}</span> sales
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsViewingSales(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Vendor Confirmation */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className='bg-white'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the vendor account
                            and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteVendor}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
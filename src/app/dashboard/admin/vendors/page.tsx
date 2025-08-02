'use client'

import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MoreVertical, UserPlus, Filter, FileText, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

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

export default function AdminVendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    useEffect(() => {
        fetchVendors()
    }, [])

    useEffect(() => {
        filterVendors()
    }, [vendors, searchTerm, statusFilter])

    async function fetchVendors() {
        try {
            setLoading(true)

            // Check if admin client is available
            if (!supabaseAdmin) {
                toast.error('Admin client not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.')
                return
            }

            // Get all users with vendor role
            const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
            
            if (authError) {
                console.error('Error fetching vendors:', authError)
                toast.error('Failed to fetch vendors')
                return
            }

            // Filter users with vendor role and convert to Vendor format
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

    function filterVendors() {
        let filtered = [...vendors]

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(vendor =>
                vendor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(vendor => vendor.status === statusFilter);
        }

        setFilteredVendors(filtered);
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'suspended':
                return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
            default:
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
        }
    };

    const updateVendorStatus = async (vendorId: string, newStatus: string) => {
        try {
            setIsUpdatingStatus(true)

            if (!supabaseAdmin) {
                toast.error('Admin client not configured.')
                return
            }

            // Get current user metadata
            const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(vendorId)
            
            if (fetchError) {
                console.error('Error fetching vendor:', fetchError)
                toast.error('Failed to fetch vendor data')
                return
            }

            // Prepare updated metadata
            const currentMetadata = currentUser.user.user_metadata || {}
            const updatedMetadata = {
                ...currentMetadata,
                status: newStatus
            }

            // Update user metadata with new status
            const { error } = await supabaseAdmin.auth.admin.updateUserById(vendorId, {
                user_metadata: updatedMetadata
            })

            if (error) {
                console.error('Error updating vendor status:', error)
                toast.error('Failed to update vendor status')
                return
            }

            // Update local state
            setVendors(vendors.map(vendor =>
                vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
            ));

            toast.success(`Vendor status updated to ${newStatus}`)
        } catch (error) {
            console.error('Error updating vendor status:', error)
            toast.error('Failed to update vendor status')
        } finally {
            setIsUpdatingStatus(false)
        }
    };

    const deleteVendor = async (vendorId: string) => {
        try {
            if (!supabaseAdmin) {
                toast.error('Admin client not configured.')
                return
            }

            // Delete user from Supabase Auth
            const { error } = await supabaseAdmin.auth.admin.deleteUser(vendorId)

            if (error) {
                console.error('Error deleting vendor:', error)
                toast.error('Failed to delete vendor')
                return
            }

            // Update local state
            setVendors(vendors.filter(vendor => vendor.id !== vendorId));
            setIsDeleteAlertOpen(false);
            toast.success('Vendor deleted successfully')
        } catch (error) {
            console.error('Error deleting vendor:', error)
            toast.error('Failed to delete vendor')
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Vendor Management</h1>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <Tabs
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                                className="w-[400px]"
                            >
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="active">Active</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="suspended">Suspended</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>

                    {filteredVendors.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No vendors found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-theme-50 dark:bg-theme-900">
                                    <TableRow className="border-b border-theme-200 dark:border-theme-800">
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Vendor</TableHead>
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Status</TableHead>
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Products</TableHead>
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Total Sales</TableHead>
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Joined</TableHead>
                                        <TableHead className="text-theme-900 dark:text-theme-100 font-semibold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVendors.map((vendor, index) => (
                                        <TableRow 
                                            key={vendor.id} 
                                            className={`border-b border-theme-100 dark:border-theme-800 hover:bg-theme-50 dark:hover:bg-theme-900/50 transition-all duration-200 ${
                                                index % 2 === 0 ? 'bg-white dark:bg-theme-950' : 'bg-theme-50 dark:bg-theme-900/50'
                                            }`}
                                        >
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center text-white text-sm font-semibold">
                                                        {vendor.full_name?.charAt(0) || vendor.email?.charAt(0) || 'V'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-theme-900 dark:text-theme-100">{vendor.full_name}</div>
                                                        <div className="text-sm text-theme-600 dark:text-theme-300">{vendor.email}</div>
                                                        <div className="text-xs text-theme-500 dark:text-theme-400">{vendor.phone}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                                            <TableCell className="text-theme-600 dark:text-theme-300">{vendor.products_count || 0}</TableCell>
                                            <TableCell className="text-theme-600 dark:text-theme-300">${(vendor.total_sales || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-theme-600 dark:text-theme-300">{formatDate(vendor.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setSelectedVendor(vendor)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />

                                                        {vendor.status !== 'active' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => updateVendorStatus(vendor.id, 'active')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                Activate Vendor
                                                            </DropdownMenuItem>
                                                        )}

                                                        {vendor.status !== 'suspended' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                                                                Suspend Vendor
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:text-red-500"
                                                            onClick={() => {
                                                                setSelectedVendor(vendor)
                                                                setIsDeleteAlertOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Vendor
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

            {/* Vendor Details Dialog */}
            {selectedVendor && (
                <Dialog open={selectedVendor !== null && !isDeleteAlertOpen} onOpenChange={(open) => !open && setSelectedVendor(null)}>
                    <DialogContent className="bg-white sm:max-w-[600px] border-0 shadow-lg">
                        <DialogHeader className="pb-4 border-b border-gray-200">
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                                Vendor Details
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 mt-2">
                                Detailed information about the vendor.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 space-y-6">
                            {/* Vendor Info */}
                            <div className="bg-theme-50 dark:bg-theme-900 p-4 rounded-lg border border-theme-200 dark:border-theme-800">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                            {selectedVendor.full_name?.charAt(0) || 'V'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.full_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedVendor.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Joined: {formatDate(selectedVendor.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        {getStatusBadge(selectedVendor.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Contact Information</Label>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                                            <p className="text-sm"><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Store Information</Label>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-medium">Products:</span> {selectedVendor.products_count || 0}</p>
                                            <p className="text-sm"><span className="font-medium">Total Sales:</span> ${(selectedVendor.total_sales || 0).toLocaleString()}</p>
                                            <p className="text-sm"><span className="font-medium">Joined:</span> {formatDate(selectedVendor.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter className="pt-4 border-t border-gray-200">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedVendor(null)}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </Button>
                            <Button 
                                onClick={() => setIsDeleteAlertOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Vendor
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the vendor
                            account and remove all associated data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => selectedVendor && deleteVendor(selectedVendor.id)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


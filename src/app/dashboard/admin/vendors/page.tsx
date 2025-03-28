'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
import { Search, MoreVertical, UserPlus, Filter, FileText, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface Vendor {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: string;
    products_count: number;
    total_sales: number;
    joined_date: string;
    avatar_url: string;
}

export default function AdminVendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)

    useEffect(() => {
        fetchVendors()
    }, [])

    useEffect(() => {
        filterVendors()
    }, [vendors, searchTerm, statusFilter])

    async function fetchVendors() {
        try {
            setLoading(true)

            // In a real app, this would be a Supabase query
            // Mock data for demonstration
            const mockVendors = [
                {
                    id: 1,
                    name: 'Jane Cooper',
                    company: 'Cooper Crafts',
                    email: 'jane@coopercrafts.com',
                    phone: '(555) 123-4567',
                    status: 'active',
                    products_count: 48,
                    total_sales: 24780,
                    joined_date: '2023-08-15T00:00:00Z',
                    avatar_url: 'https://i.pravatar.cc/150?img=1',
                },
                {
                    id: 2,
                    name: 'Robert Fox',
                    company: 'Fox Electronics',
                    email: 'robert@foxelectronics.com',
                    phone: '(555) 234-5678',
                    status: 'active',
                    products_count: 32,
                    total_sales: 18650,
                    joined_date: '2023-09-22T00:00:00Z',
                    avatar_url: 'https://i.pravatar.cc/150?img=8',
                },
                {
                    id: 3,
                    name: 'Leslie Alexander',
                    company: 'Alexander Apparel',
                    email: 'leslie@alexanderapparel.com',
                    phone: '(555) 345-6789',
                    status: 'pending',
                    products_count: 0,
                    total_sales: 0,
                    joined_date: '2025-03-18T00:00:00Z',
                    avatar_url: 'https://i.pravatar.cc/150?img=3',
                },
                {
                    id: 4,
                    name: 'Esther Howard',
                    company: 'Howard Home Goods',
                    email: 'esther@howardhome.com',
                    phone: '(555) 456-7890',
                    status: 'suspended',
                    products_count: 15,
                    total_sales: 8920,
                    joined_date: '2024-01-10T00:00:00Z',
                    avatar_url: 'https://i.pravatar.cc/150?img=4',
                },
                {
                    id: 5,
                    name: 'Cameron Williamson',
                    company: 'Williamson Wares',
                    email: 'cameron@williamsonwares.com',
                    phone: '(555) 567-8901',
                    status: 'active',
                    products_count: 27,
                    total_sales: 15340,
                    joined_date: '2024-02-05T00:00:00Z',
                    avatar_url: 'https://i.pravatar.cc/150?img=5',
                },
            ]

            setVendors(mockVendors)
            setFilteredVendors(mockVendors)
        } catch (error) {
            console.error('Error fetching vendors:', error)
        } finally {
            setLoading(false)
        }
    }

    function filterVendors() {
        let filtered = [...vendors]

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(vendor =>
                vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'suspended':
                return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    const updateVendorStatus = async (vendorId: number, newStatus: string) => {
        try {
            // In a real app, this would update the vendor in Supabase
            setVendors(vendors.map(vendor =>
                vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
            ));
        } catch (error: any) {
            console.error('Error updating vendor status:', error);
        }
    };

    const deleteVendor = async (vendorId: number) => {
        try {
            // In a real app, this would delete the vendor from Supabase
            setVendors(vendors.filter(vendor => vendor.id !== vendorId));
            setIsDeleteAlertOpen(false);
        } catch (error: any) {
            console.error('Error deleting vendor:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading vendors...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Vendor Management</h1>
                {/* <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Vendor
                </Button> */}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            /> */}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* <Filter className="h-4 w-4 text-gray-500" /> */}
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

                    {vendors.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No vendors found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Products</TableHead>
                                        <TableHead>Total Sales</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendors.map((vendor) => (
                                        <TableRow key={vendor.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={vendor.avatar_url} alt={vendor.name} />
                                                        <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{vendor.name}</div>
                                                        <div className="text-sm text-muted-foreground">{vendor.company}</div>
                                                        <div className="text-xs text-muted-foreground">{vendor.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                                            <TableCell>{vendor.products_count}</TableCell>
                                            <TableCell>${vendor.total_sales.toLocaleString()}</TableCell>
                                            <TableCell>{formatDate(vendor.joined_date)}</TableCell>
                                            <TableCell className="text-right">
                                                {/* <DropdownMenu>
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
                                                            <DropdownMenuItem onClick={() => updateVendorStatus(vendor.id, 'active')}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                Activate Vendor
                                                            </DropdownMenuItem>
                                                        )}

                                                        {vendor.status !== 'suspended' && (
                                                            <DropdownMenuItem onClick={() => updateVendorStatus(vendor.id, 'suspended')}>
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
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Delete Vendor
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu> */}
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
            {/* {selectedVendor && (
                <Dialog open={selectedVendor !== null && !isDeleteAlertOpen} onOpenChange={(open) => !open && setSelectedVendor(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Vendor Details</DialogTitle>
                            <DialogDescription>
                                Detailed information about the vendor.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedVendor.avatar_url} alt={selectedVendor.name} />
                                    <AvatarFallback>{selectedVendor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-medium">{selectedVendor.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedVendor.company}</p>
                                    <div className="mt-1">{getStatusBadge(selectedVendor.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm">Email: {selectedVendor.email}</p>
                                        <p className="text-sm">Phone: {selectedVendor.phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Store Information</h4>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm">Products: {selectedVendor.products_count}</p>
                                        <p className="text-sm">Total Sales: ${selectedVendor.total_sales.toLocaleString()}</p>
                                        <p className="text-sm">Joined: {formatDate(selectedVendor.joined_date)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`/dashboard/admin/products?vendor=${selectedVendor.id}`}>
                                            View Products
                                        </a>
                                    </Button>

                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`/dashboard/admin/vendors/edit/${selectedVendor.id}`}>
                                            Edit Vendor
                                        </a>
                                    </Button>

                                    {selectedVendor.status !== 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-500"
                                            onClick={() => {
                                                updateVendorStatus(selectedVendor.id, 'active')
                                                setSelectedVendor({ ...selectedVendor, status: 'active' })
                                            }}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Activate
                                        </Button>
                                    )}

                                    {selectedVendor.status !== 'suspended' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-amber-500"
                                            onClick={() => {
                                                updateVendorStatus(selectedVendor.id, 'suspended')
                                                setSelectedVendor({ ...selectedVendor, status: 'suspended' })
                                            }}
                                        >
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            Suspend
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => setIsDeleteAlertOpen(true)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )} */}

            {/* Delete Confirmation Dialog */}
            {/* <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
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
            </AlertDialog> */}
        </div>
    );
};


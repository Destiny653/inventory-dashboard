 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MapPin, Mail, Phone, Calendar, User as UserIcon, Briefcase, Trash } from 'lucide-react'
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
import { toast } from 'sonner'

interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    created_at: string;
    avatar_url?: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        filterUsers()
    }, [users, searchTerm])

    async function fetchUsers() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            if (data) {
                setUsers(data)
                setFilteredUsers(data)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    function filterUsers() {
        const filtered = users.filter(user =>
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredUsers(filtered)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'manager':
                return 'bg-blue-100 text-blue-800';
            case 'customer':
                return 'bg-green-100 text-green-800';
            case 'employee':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId)
        setDeleteDialogOpen(true)
    }

    const deleteUser = async () => {
        if (!userToDelete) return
        
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userToDelete)

            if (error) throw error

            toast.success('User deleted successfully')
            fetchUsers() // Refresh the user list
        } catch (error) {
            console.error('Error deleting user:', error)
            toast.error('Failed to delete user')
        } finally {
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-slate-600 animate-pulse">Loading users...</div>
            </div>
        )
    }

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[300px] bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                            />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            Add New Customer
                        </Button>
                    </div>
                </div>

                <Card className="bg-white shadow-lg border border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-slate-800">Customer List</CardTitle>
                            <div className="text-sm text-slate-500">
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'customer' : 'customers'} found
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-500">No customers found matching your criteria</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 text-blue-600 border-blue-300 hover:bg-blue-50"
                                    onClick={() => setSearchTerm('')}
                                >
                                    Clear search
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-100 hover:bg-slate-100">
                                            <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Location</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Joined Date</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow 
                                                key={user.id} 
                                                className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="border-2 border-slate-200 shadow-sm">
                                                            <AvatarImage src={user.avatar_url} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-600">
                                                                {user.full_name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-slate-800">
                                                                {user.full_name}
                                                            </div>
                                                            <div className="flex items-center text-sm text-slate-500">
                                                                <Mail className="h-3 w-3 mr-1" />
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <Phone className="h-3 w-3 mr-1 text-blue-500" />
                                                        <span className="font-medium">{user.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm">
                                                        <MapPin className="h-3 w-3 mr-1 text-red-500" />
                                                        <span className="text-slate-700 font-medium">{user.location}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center text-xs px-2 py-1 rounded-full w-fit ${getRoleColor(user.role)}`}>
                                                        <Briefcase className="h-3 w-3 mr-1" />
                                                        {user.role}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm bg-slate-50 px-2 py-1 rounded text-slate-600 w-fit">
                                                        <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                                                        {formatDate(user.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleDeleteClick(user.id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer account
                            and remove all associated data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={deleteUser}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
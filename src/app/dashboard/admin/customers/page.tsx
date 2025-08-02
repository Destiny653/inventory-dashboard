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
import { Search, Mail, Phone, Calendar, Trash, MessageSquare, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  avatar_url?: string;
  picture?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)

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
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Error fetching user profiles:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  function filterUsers() {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const deleteUser = async () => {
    if (!userToDelete) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userToDelete)

      if (error) throw error

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedUser) return

    try {
      setSendingEmail(true)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailContent.subject,
          message: emailContent.message
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Message sent successfully')
      setMessageDialogOpen(false)
      setEmailContent({ subject: '', message: '' })
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingEmail(false)
    }
  }

  const renderActionsCell = (user: UserProfile) => (
    <div className="flex gap-2">
      <Dialog 
        open={messageDialogOpen} 
        onOpenChange={setMessageDialogOpen}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => setSelectedUser(user)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white sm:max-w-[600px] border-0 shadow-lg">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Send Message to {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Send a personalized message to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* Recipient Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {selectedUser?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser?.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Message Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({
                    ...emailContent,
                    subject: e.target.value
                  })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter message subject..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({
                    ...emailContent,
                    message: e.target.value
                  })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                  rows={6}
                  placeholder="Write your message here..."
                />
                <p className="text-xs text-gray-500">
                  Your message will be sent with a professional email template.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setMessageDialogOpen(false)}
              disabled={sendingEmail}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!emailContent.subject.trim() || !emailContent.message.trim() || sendingEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="icon"
        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
        onClick={() => handleDeleteClick(user.id)}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )

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
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px] bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="text-slate-800">User List</CardTitle>
              <div className="text-sm text-slate-500">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">No users found matching your criteria</p>
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
                      <TableHead className="font-semibold text-slate-700">User</TableHead>
                      <TableHead className="font-semibold text-slate-700">Contact</TableHead>
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
                              <AvatarImage src={user.avatar_url || user.picture} />
                              <AvatarFallback className="bg-slate-100 text-slate-600">
                                {user.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-800">
                                {user.full_name || 'Unknown'}
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
                            <span className="font-medium">{user.phone || 'Not provided'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm bg-slate-50 px-2 py-1 rounded text-slate-600 w-fit">
                            <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className='bg-[#fff]'>
                          {renderActionsCell(user)}
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
              This action cannot be undone. This will permanently delete the user account
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
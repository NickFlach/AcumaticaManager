import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  userListFiltersSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  resetUserPasswordSchema,
  type UserListFilters,
  type UpdateUserRole,
  type UpdateUserStatus,
  type ResetUserPassword,
  type UserListResponse,
  type UserWithStats
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Key, 
  Shield, 
  Eye,
  RefreshCw,
  Download,
  UserPlus,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filters form
  const filtersForm = useForm<UserListFilters>({
    resolver: zodResolver(userListFiltersSchema),
    defaultValues: {
      search: "",
      role: undefined,
      status: undefined,
      emailVerified: undefined,
      page: 1,
      limit: 20,
    },
  });

  // Role update form
  const roleForm = useForm<UpdateUserRole>({
    resolver: zodResolver(updateUserRoleSchema),
    defaultValues: {
      userId: "",
      role: "user",
    },
  });

  // Password reset form
  const passwordForm = useForm<ResetUserPassword>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: {
      userId: "",
      newPassword: "",
    },
  });

  const filters = filtersForm.watch();

  // Get users list
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users', filters],
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.emailVerified !== undefined) params.append('emailVerified', filters.emailVerified.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiRequest('GET', `/api/admin/users?${params.toString()}`);
      return response.json();
    },
    retry: false,
  });

  // Get user audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const response = await apiRequest('GET', `/api/admin/audit-logs/${selectedUser.id}`);
      return response.json();
    },
    enabled: !!selectedUser?.id,
    retry: false,
  });

  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: UpdateUserRole) => {
      const response = await apiRequest('PUT', '/api/admin/users/role', data);
      return response.json();
    },
    onSuccess: () => {
      setShowRoleDialog(false);
      setSelectedUser(null);
      refetchUsers();
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: UpdateUserStatus) => {
      const response = await apiRequest('PUT', '/api/admin/users/status', data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      refetchUsers();
      toast({
        title: "Status Updated",
        description: `User has been ${variables.isActive ? 'activated' : 'deactivated'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetUserPassword) => {
      const response = await apiRequest('POST', '/api/admin/users/reset-password', data);
      return response.json();
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setSelectedUser(null);
      passwordForm.reset();
      toast({
        title: "Password Reset",
        description: "User password has been successfully reset.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset user password.",
        variant: "destructive",
      });
    },
  });

  const handleRoleUpdate = async (data: UpdateUserRole) => {
    await updateRoleMutation.mutateAsync(data);
  };

  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    await updateStatusMutation.mutateAsync({ userId, isActive });
  };

  const handlePasswordReset = async (data: ResetUserPassword) => {
    await resetPasswordMutation.mutateAsync(data);
  };

  const openRoleDialog = (userToUpdate: UserWithStats) => {
    setSelectedUser(userToUpdate);
    roleForm.setValue('userId', userToUpdate.id);
    roleForm.setValue('role', userToUpdate.role as 'user' | 'manager' | 'admin');
    setShowRoleDialog(true);
  };

  const openPasswordDialog = (userToUpdate: UserWithStats) => {
    setSelectedUser(userToUpdate);
    passwordForm.setValue('userId', userToUpdate.id);
    passwordForm.setValue('newPassword', '');
    setShowPasswordDialog(true);
  };

  const openDetailsDialog = (userToView: UserWithStats) => {
    setSelectedUser(userToView);
    setShowDetailsDialog(true);
  };

  // Check if current user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="admin-users-page">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users, roles, and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => refetchUsers()}
              disabled={usersLoading}
              data-testid="button-refresh-users"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" disabled data-testid="button-export-users">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button disabled data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card data-testid="card-user-filters">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...filtersForm}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={filtersForm.control}
                  name="search"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            placeholder="Search users..."
                            className="pl-10"
                            data-testid="input-search-users"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={filtersForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role-filter">
                            <SelectValue placeholder="All roles" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={filtersForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status-filter">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={filtersForm.control}
                  name="emailVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === 'true' ? true : value === 'false' ? false : undefined)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-email-filter">
                            <SelectValue placeholder="All emails" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Verified</SelectItem>
                          <SelectItem value="false">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card data-testid="card-users-table">
          <CardHeader>
            <CardTitle>
              Users {usersData && `(${usersData.totalCount})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : usersData && usersData.users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((userData: UserWithStats) => (
                      <TableRow key={userData.id} data-testid={`user-row-${userData.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(userData.firstName, userData.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{userData.firstName} {userData.lastName}</p>
                              <p className="text-sm text-gray-600">@{userData.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(userData.role)} data-testid={`badge-role-${userData.id}`}>
                            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {userData.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge 
                              variant={userData.isActive ? "default" : "secondary"}
                              data-testid={`badge-status-${userData.id}`}
                            >
                              {userData.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{userData.email}</span>
                            {userData.emailVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" data-testid={`text-last-login-${userData.id}`}>
                            {formatDate(userData.lastLoginAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium" data-testid={`text-project-count-${userData.id}`}>
                            {userData.projectCount || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openDetailsDialog(userData)}
                              data-testid={`button-view-${userData.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRoleDialog(userData)}
                              data-testid={`button-edit-role-${userData.id}`}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  data-testid={`button-toggle-status-${userData.id}`}
                                >
                                  {userData.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {userData.isActive ? 'Deactivate' : 'Activate'} User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {userData.isActive ? 'deactivate' : 'activate'} {userData.firstName} {userData.lastName}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleStatusToggle(userData.id, !userData.isActive)}
                                    data-testid={`button-confirm-toggle-${userData.id}`}
                                  >
                                    {userData.isActive ? 'Deactivate' : 'Activate'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openPasswordDialog(userData)}
                              data-testid={`button-reset-password-${userData.id}`}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Update Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent data-testid="dialog-update-role">
            <DialogHeader>
              <DialogTitle>Update User Role</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>
                <Form {...roleForm}>
                  <form onSubmit={roleForm.handleSubmit(handleRoleUpdate)} className="space-y-4">
                    <FormField
                      control={roleForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-new-role">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowRoleDialog(false)}
                        data-testid="button-cancel-role"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateRoleMutation.isPending}
                        data-testid="button-confirm-role"
                      >
                        {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent data-testid="dialog-reset-password">
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Enter new password"
                              data-testid="input-new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowPasswordDialog(false)}
                        data-testid="button-cancel-password"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={resetPasswordMutation.isPending}
                        data-testid="button-confirm-password"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-user-details">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p className="font-medium">@{selectedUser.username}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <Badge variant={getRoleVariant(selectedUser.role)}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Email Verified</label>
                      <Badge variant={selectedUser.emailVerified ? "default" : "secondary"}>
                        {selectedUser.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Last Login</label>
                      <p className="font-medium">{formatDate(selectedUser.lastLoginAt)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Projects</label>
                      <p className="font-medium">{selectedUser.projectCount || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Tasks</label>
                      <p className="font-medium">{selectedUser.taskCount || 0}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="space-y-4">
                  {auditLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : auditLogs && auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.map((log: any) => (
                        <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Activity className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-gray-600">{formatDate(log.createdAt)}</p>
                          </div>
                          {log.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No activity logs found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
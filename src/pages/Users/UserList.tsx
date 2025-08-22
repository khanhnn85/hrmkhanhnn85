import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Key, User as UserIcon, MapPin, Home, CreditCard } from 'lucide-react';
import { DatabaseService } from '../../lib/supabase';
import { User, Employee } from '../../types/database';
import { UserForm } from '../../components/Forms/UserForm';
import { PasswordResetForm } from '../../components/Forms/PasswordResetForm';
import { EmployeeDetailModal } from '../../components/Modals/EmployeeDetailModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const roleLabels = {
  ADMIN: { label: 'Quản trị viên', color: 'bg-red-100 text-red-800' },
  HR: { label: 'Nhân sự', color: 'bg-blue-100 text-blue-800' },
  EMPLOYEE: { label: 'Nhân viên', color: 'bg-green-100 text-green-800' },
};

const statusLabels = {
  ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
  DISABLED: { label: 'Vô hiệu hóa', color: 'bg-red-100 text-red-800' },
};

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('👥 Loading users...');
      const data = await DatabaseService.getUsersWithMockData();
      console.log('👥 Loaded users:', data);
      setUsers(data);
      
      console.log('👥 Loading employees...');
      const employeeData = await DatabaseService.getEmployees();
      console.log('👥 Loaded employees:', employeeData);
      setEmployees(employeeData);
    } catch (error) {
      console.error('👥 Error loading data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.full_name}"?`)) {
      return;
    }

    try {
      await DatabaseService.deleteUser(user.id);
      toast.success('Xóa người dùng thành công');
      loadData();
    } catch (error) {
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    
    try {
      await DatabaseService.updateUser(user.id, { status: newStatus });
      toast.success(`${newStatus === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`);
      loadData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái người dùng');
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordForm(true);
  };

  const handleViewEmployeeDetail = (user: User) => {
    setSelectedUser(user);
    setShowEmployeeDetail(true);
  };

  const getUserEmployee = (userId: string) => {
    return employees.find(emp => emp.user_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng & nhân viên</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản, phân quyền và thông tin nhân viên ({filteredUsers.length} người dùng)
          </p>
        </div>
        
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên, email hoặc username..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả vai trò</option>
              {Object.entries(roleLabels).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thông tin nhân viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role === 'EMPLOYEE' ? (
                    <div>
                      {getUserEmployee(user.id) ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {getUserEmployee(user.id)?.place_of_residence || 'Chưa cập nhật'}
                          </div>
                          <div className="text-sm text-gray-500">
                            <Home className="h-4 w-4 inline mr-1" />
                            {getUserEmployee(user.id)?.hometown || 'Chưa cập nhật'}
                          </div>
                          <button
                            onClick={() => handleViewEmployeeDetail(user)}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa có thông tin</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleLabels[user.role].color}`}>
                    {roleLabels[user.role].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusLabels[user.status].color}`}>
                    {statusLabels[user.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`${user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={user.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      {user.status === 'ACTIVE' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Đặt lại mật khẩu"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy người dùng nào</div>
          </div>
        )}
      </div>

      {/* Forms */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
            loadData();
          }}
        />
      )}

      {showPasswordForm && selectedUser && (
        <PasswordResetForm
          user={selectedUser}
          onClose={() => {
            setShowPasswordForm(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEmployeeDetail && selectedUser && (
        <EmployeeDetailModal
          user={selectedUser}
          employee={getUserEmployee(selectedUser.id)}
          onClose={() => {
            setShowEmployeeDetail(false);
            setSelectedUser(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
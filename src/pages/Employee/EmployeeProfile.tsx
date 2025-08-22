import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, User, MapPin, Home, CreditCard } from 'lucide-react';
import { employeeSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Employee } from '../../types/database';
import toast from 'react-hot-toast';

interface EmployeeFormData {
  place_of_residence: string;
  hometown: string;
  national_id: string;
}

export function EmployeeProfile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  });

  useEffect(() => {
    if (user) {
      loadEmployeeProfile();
    }
  }, [user]);

  const loadEmployeeProfile = async () => {
    if (!user) return;

    try {
      const employees = await DatabaseService.getEmployees();
      const userEmployee = employees.find(emp => emp.user_id === user.id);
      
      if (userEmployee) {
        setEmployee(userEmployee);
        reset({
          place_of_residence: userEmployee.place_of_residence,
          hometown: userEmployee.hometown,
          national_id: userEmployee.national_id
        });
      } else {
        // Create new employee record if doesn't exist
        const newEmployee = await DatabaseService.createEmployee({
          user_id: user.id,
          place_of_residence: '',
          hometown: '',
          national_id: ''
        });
        setEmployee(newEmployee);
      }
    } catch (error) {
      console.error('Error loading employee profile:', error);
      toast.error('Lỗi khi tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;

    setIsSubmitting(true);

    try {
      const updatedEmployee = await DatabaseService.updateEmployee(employee.id, data);
      setEmployee(updatedEmployee);
      toast.success('Cập nhật thông tin cá nhân thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin cá nhân và liên hệ
        </p>
      </div>

      {/* Basic Info (Read-only) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Thông tin tài khoản
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <p className="mt-1 text-sm text-gray-900">{user?.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <p className="mt-1 text-sm text-gray-900">{user?.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
              <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info (Editable) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Thông tin cá nhân
          </h3>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Home className="h-4 w-4 inline mr-1" />
                  Chỗ ở hiện tại *
                </label>
                <input
                  type="text"
                  {...register('place_of_residence')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ chỗ ở hiện tại"
                />
                {errors.place_of_residence && (
                  <p className="mt-1 text-sm text-red-600">{errors.place_of_residence.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Quê quán *
                </label>
                <input
                  type="text"
                  {...register('hometown')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ quê quán"
                />
                {errors.hometown && (
                  <p className="mt-1 text-sm text-red-600">{errors.hometown.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Số căn cước công dân *
                </label>
                <input
                  type="text"
                  {...register('national_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số căn cước công dân (12 số)"
                  maxLength={12}
                />
                {errors.national_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.national_id.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Nhập chính xác 12 chữ số của căn cước công dân
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Lưu ý quan trọng
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Thông tin cá nhân sẽ được sử dụng cho các thủ tục nhân sự</li>
                <li>Vui lòng cập nhật thông tin chính xác và đầy đủ</li>
                <li>Nếu có thay đổi địa chỉ, vui lòng cập nhật ngay</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
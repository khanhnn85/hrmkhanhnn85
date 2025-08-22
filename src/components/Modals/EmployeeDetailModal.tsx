import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, User, MapPin, Home, CreditCard, Mail, Phone } from 'lucide-react';
import { employeeSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { User as UserType, Employee } from '../../types/database';
import toast from 'react-hot-toast';

interface EmployeeFormData {
  place_of_residence: string;
  hometown: string;
  national_id: string;
}

interface EmployeeDetailModalProps {
  user: UserType;
  employee?: Employee;
  onClose: () => void;
}

export function EmployeeDetailModal({ user, employee, onClose }: EmployeeDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      place_of_residence: employee.place_of_residence,
      hometown: employee.hometown,
      national_id: employee.national_id
    } : {
      place_of_residence: '',
      hometown: '',
      national_id: ''
    }
  });

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);

    try {
      if (employee) {
        // Update existing employee
        await DatabaseService.updateEmployee(employee.id, data);
        toast.success('Cập nhật thông tin nhân viên thành công');
      } else {
        // Create new employee record
        await DatabaseService.createEmployee({
          user_id: user.id,
          ...data
        });
        toast.success('Tạo hồ sơ nhân viên thành công');
      }

      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết nhân viên: {user.full_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information (Read-only) */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Thông tin tài khoản
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                <p className="mt-1 text-sm text-gray-900">@{user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Nhân viên
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                </span>
              </div>
            </div>
          </div>

          {/* Employee Information (Editable) */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Thông tin cá nhân
            </h4>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div>
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Đang lưu...' : employee ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Lưu ý quan trọng
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Thông tin tài khoản chỉ có thể chỉnh sửa từ phần "Chỉnh sửa người dùng"</li>
                  <li>Thông tin cá nhân sẽ được sử dụng cho các thủ tục nhân sự</li>
                  <li>Vui lòng đảm bảo thông tin chính xác và đầy đủ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
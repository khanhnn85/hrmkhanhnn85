import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { userSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { User } from '../../types/database';
import { generateUsername, generatePassword } from '../../utils/validation';
import toast from 'react-hot-toast';

interface UserFormData {
  username: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
}

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

export function UserForm({ user, onClose }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      username: user.username,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role
    } : {}
  });

  const fullName = watch('full_name');

  const handleGenerateUsername = async () => {
    if (!fullName) {
      toast.error('Vui lòng nhập họ tên trước');
      return;
    }

    try {
      const existingUsers = await DatabaseService.getUsersWithMockData();
      const existingUsernames = existingUsers.map(u => u.username);
      const newUsername = generateUsername(fullName, existingUsernames);
      setValue('username', newUsername);
      toast.success('Đã tạo username tự động');
    } catch (error) {
      toast.error('Lỗi khi tạo username');
    }
  };

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);

    try {
      if (user) {
        // Update existing user
        await DatabaseService.updateUser(user.id, data);
        toast.success('Cập nhật người dùng thành công');
      } else {
        // Create new user
        const password = generatePassword();
        setGeneratedPassword(password);
        
        await DatabaseService.createUser({
          ...data,
          password_hash: password, // In real app, this would be hashed
          status: 'ACTIVE'
        });
        
        toast.success(`Tạo người dùng thành công! Mật khẩu: ${password}`);
      }

      onClose();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Email hoặc username đã tồn tại');
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                {...register('full_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập họ và tên đầy đủ"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0912345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  {...register('username')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
                <button
                  type="button"
                  onClick={handleGenerateUsername}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  Tự động
                </button>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò *
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn vai trò</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="HR">Nhân sự</option>
                <option value="EMPLOYEE">Nhân viên</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Lưu ý về mật khẩu
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Mật khẩu sẽ được tạo tự động và hiển thị sau khi tạo tài khoản thành công.</p>
                    <p>Vui lòng lưu lại mật khẩu để cung cấp cho người dùng.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {generatedPassword && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Mật khẩu đã tạo
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p className="font-mono bg-white px-2 py-1 rounded border">
                      {generatedPassword}
                    </p>
                    <p className="mt-1">Vui lòng sao chép và lưu lại mật khẩu này!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : user ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
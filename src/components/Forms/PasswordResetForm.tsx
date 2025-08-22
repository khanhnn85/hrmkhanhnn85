import React, { useState } from 'react';
import { X, Copy, RefreshCw } from 'lucide-react';
import { User } from '../../types/database';
import { DatabaseService } from '../../lib/supabase';
import { generatePassword } from '../../utils/validation';
import toast from 'react-hot-toast';

interface PasswordResetFormProps {
  user: User;
  onClose: () => void;
}

export function PasswordResetForm({ user, onClose }: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setNewPassword(password);
  };

  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      toast.success('Đã sao chép mật khẩu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast.error('Vui lòng tạo mật khẩu mới');
      return;
    }

    setIsSubmitting(true);

    try {
      await DatabaseService.updateUser(user.id, {
        password_hash: newPassword // In real app, this would be hashed
      });
      
      toast.success('Đặt lại mật khẩu thành công');
      onClose();
    } catch (error) {
      toast.error('Lỗi khi đặt lại mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Đặt lại mật khẩu
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="text-sm text-gray-600 mb-4">
              <p><strong>Người dùng:</strong> {user.full_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tạo mật khẩu
              </button>
              
              {newPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép
                </button>
              )}
            </div>

            {newPassword && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="font-mono text-sm break-all">{newPassword}</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Lưu ý quan trọng
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Mật khẩu mới sẽ thay thế mật khẩu hiện tại</li>
                    <li>Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập</li>
                    <li>Vui lòng lưu lại và cung cấp mật khẩu cho người dùng</li>
                  </ul>
                </div>
              </div>
            </div>
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
              disabled={isSubmitting || !newPassword}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
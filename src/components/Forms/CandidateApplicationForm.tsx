import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText, X } from 'lucide-react';
import { candidateSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { Position } from '../../types/database';
import toast from 'react-hot-toast';
import { runAutoFormFiller } from '../../utils/autoFormFiller';

interface CandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  applied_position_id: string;
}

export function CandidateApplicationForm() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema)
  });

  useEffect(() => {
    loadPositions();
  }, [positions]);

  const loadPositions = async () => {
    try {
      const data = await DatabaseService.getOpenPositions();
      setPositions(data);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Lỗi khi tải danh sách vị trí. Sử dụng dữ liệu mẫu.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file PDF, DOC, DOCX');
        return;
      }

      if (file.size > maxSize) {
        toast.error('Kích thước file không được vượt quá 10MB');
        return;
      }

      setCvFile(file);
    }
  };

  const onSubmit = async (data: CandidateFormData) => {
    if (!cvFile) {
      toast.error('Vui lòng tải lên CV');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, you would upload the CV file to storage here
      // For now, we'll use a placeholder URL
      const cvUrl = `cv/${Date.now()}_${cvFile.name}`;

      await DatabaseService.createCandidate({
        ...data,
        cv_url: cvUrl,
        status: 'SUBMITTED'
      });

      toast.success('Nộp hồ sơ thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      reset();
      setCvFile(null);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error('Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Nộp hồ sơ ứng tuyển</h2>
          <p className="mt-2 text-sm text-gray-600">
            Điền thông tin để ứng tuyển vào vị trí phù hợp
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                {...register('full_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0912345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vị trí ứng tuyển *
              </label>
              <select
                {...register('applied_position_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn vị trí ứng tuyển</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.title} - {position.department}
                  </option>
                ))}
              </select>
              {errors.applied_position_id && (
                <p className="mt-1 text-sm text-red-600">{errors.applied_position_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CV/Hồ sơ *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  {cvFile ? (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-900">{cvFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCvFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Tải lên file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">hoặc kéo thả vào đây</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX tối đa 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi hồ sơ'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Bằng cách gửi hồ sơ, bạn đồng ý với điều khoản sử dụng của chúng tôi
        </div>
      </div>
    </div>
  );
}
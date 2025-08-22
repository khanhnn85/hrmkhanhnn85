import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { interviewSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Interview } from '../../types/database';
import toast from 'react-hot-toast';

interface InterviewFormData {
  tech_notes: string;
  soft_notes: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
}

interface InterviewFormProps {
  candidateId: string;
  interview?: Interview;
  onClose: () => void;
}

export function InterviewForm({ candidateId, interview, onClose }: InterviewFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: interview ? {
      tech_notes: interview.tech_notes,
      soft_notes: interview.soft_notes,
      result: interview.result
    } : {
      result: 'PENDING'
    }
  });

  const onSubmit = async (data: InterviewFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      if (interview) {
        // Update existing interview
        await DatabaseService.updateInterview(interview.id, data);
        toast.success('Cập nhật phiếu phỏng vấn thành công');
      } else {
        // Create new interview
        await DatabaseService.createInterview({
          candidate_id: candidateId,
          interviewer_id: user.id,
          ...data
        });
        
        // Update candidate status based on interview result
        if (data.result === 'PASS') {
          // Don't auto-update status, let HR decide manually
          console.log('Interview result: PASS - HR can manually move to APPROVED');
        } else if (data.result === 'FAIL') {
          await DatabaseService.updateCandidate(candidateId, { status: 'REJECTED' });
        }
        
        toast.success('Tạo phiếu phỏng vấn thành công');
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
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {interview ? 'Chỉnh sửa phiếu phỏng vấn' : 'Tạo phiếu phỏng vấn'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đánh giá chuyên môn *
            </label>
            <textarea
              {...register('tech_notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập đánh giá về khả năng chuyên môn của ứng viên..."
            />
            {errors.tech_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.tech_notes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đánh giá kỹ năng mềm *
            </label>
            <textarea
              {...register('soft_notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập đánh giá về kỹ năng giao tiếp, làm việc nhóm, thái độ..."
            />
            {errors.soft_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.soft_notes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kết quả phỏng vấn *
            </label>
            <select
              {...register('result')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Đang xử lý</option>
              <option value="PASS">Đạt</option>
              <option value="FAIL">Không đạt</option>
            </select>
            {errors.result && (
              <p className="mt-1 text-sm text-red-600">{errors.result.message}</p>
            )}
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : interview ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
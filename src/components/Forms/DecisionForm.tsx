import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { decisionSchema } from '../../utils/validation';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DecisionFormData {
  decision: 'HIRE' | 'NO_HIRE';
  decision_notes: string;
}

interface DecisionFormProps {
  candidateId: string;
  onClose: () => void;
}

export function DecisionForm({ candidateId, onClose }: DecisionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<DecisionFormData>({
    resolver: zodResolver(decisionSchema)
  });

  const decision = watch('decision');

  const onSubmit = async (data: DecisionFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Create decision
      await DatabaseService.createDecision({
        candidate_id: candidateId,
        decided_by: user.id,
        ...data
      });

      // Update candidate status
      const newStatus = data.decision === 'HIRE' ? 'OFFERED' : 'NOT_HIRED';
      await DatabaseService.updateCandidate(candidateId, { status: newStatus });

      toast.success('Quyết định đã được lưu và email sẽ được gửi');
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Quyết định tuyển dụng
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quyết định *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="HIRE"
                  {...register('decision')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Tuyển dụng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="NO_HIRE"
                  {...register('decision')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Không tuyển</span>
              </label>
            </div>
            {errors.decision && (
              <p className="mt-1 text-sm text-red-600">{errors.decision.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú quyết định *
            </label>
            <textarea
              {...register('decision_notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={decision === 'HIRE' ? 'Lý do tuyển dụng, mức lương, thời gian bắt đầu...' : 'Lý do không phù hợp, khuyến khích cho lần sau...'}
            />
            {errors.decision_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_notes.message}</p>
            )}
          </div>

          {decision && (
            <div className={`p-3 rounded-md ${decision === 'HIRE' ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${decision === 'HIRE' ? 'text-green-800' : 'text-red-800'}`}>
                {decision === 'HIRE' 
                  ? '✓ Ứng viên sẽ nhận email thông báo trúng tuyển'
                  : '✗ Ứng viên sẽ nhận email thông báo không phù hợp'}
              </p>
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
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
                decision === 'HIRE' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận quyết định'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2, Calendar, Users } from 'lucide-react';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types/database';
import toast from 'react-hot-toast';

interface InterviewSessionFormData {
  title: string;
  scheduled_date: string;
  interviewers: string[];
}

interface InterviewSessionFormProps {
  candidateId: string;
  candidateName: string;
  onClose: () => void;
}

export function InterviewSessionForm({ candidateId, candidateName, onClose }: InterviewSessionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInterviewers, setAvailableInterviewers] = useState<UserType[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<InterviewSessionFormData>();

  useEffect(() => {
    loadInterviewers();
  }, []);

  const loadInterviewers = async () => {
    try {
      const users = await DatabaseService.getUsersWithMockData();
      // Get all active users as potential interviewers (any employee can interview)
      const interviewers = users.filter(u => u.status === 'ACTIVE');
      setAvailableInterviewers(interviewers);
    } catch (error) {
      console.error('Error loading interviewers:', error);
    }
  };

  const addInterviewer = (interviewerId: string) => {
    if (!selectedInterviewers.includes(interviewerId)) {
      setSelectedInterviewers([...selectedInterviewers, interviewerId]);
    }
  };

  const removeInterviewer = (interviewerId: string) => {
    setSelectedInterviewers(selectedInterviewers.filter(id => id !== interviewerId));
  };

  const onSubmit = async (data: InterviewSessionFormData) => {
    if (!user) return;

    if (selectedInterviewers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người phỏng vấn');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create interview session
      const session = await DatabaseService.createInterviewSession({
        candidate_id: candidateId,
        title: data.title,
        scheduled_date: data.scheduled_date,
        created_by: user.id
      });

      // Create individual interview records for each interviewer
      for (const interviewerId of selectedInterviewers) {
        await DatabaseService.createInterview({
          candidate_id: candidateId,
          interviewer_id: interviewerId,
          interview_session_id: session.id,
          tech_notes: '',
          soft_notes: '',
          result: 'PENDING'
        });
      }

      // Update candidate status to INTERVIEW
      await DatabaseService.updateCandidate(candidateId, { status: 'INTERVIEW' });

      toast.success(`Đã tạo cuộc phỏng vấn với ${selectedInterviewers.length} người phỏng vấn`);
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInterviewerName = (id: string) => {
    const interviewer = availableInterviewers.find(u => u.id === id);
    return interviewer?.full_name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Tạo cuộc phỏng vấn
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Ứng viên:</strong> {candidateName}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề cuộc phỏng vấn *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Phỏng vấn ${candidateName}`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian dự kiến
            </label>
            <input
              type="datetime-local"
              {...register('scheduled_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn người phỏng vấn *
            </label>
            
            <div className="mb-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addInterviewer(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn người phỏng vấn...</option>
                {availableInterviewers
                  .filter(interviewer => !selectedInterviewers.includes(interviewer.id))
                  .map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.full_name} - {interviewer.role} ({interviewer.email})
                    </option>
                  ))}
              </select>
            </div>

            {selectedInterviewers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Người phỏng vấn đã chọn ({selectedInterviewers.length}):
                </p>
                {selectedInterviewers.map((interviewerId) => (
                  <div key={interviewerId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-900">
                      {getInterviewerName(interviewerId)} - {availableInterviewers.find(u => u.id === interviewerId)?.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInterviewer(interviewerId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Lưu ý về quy trình phỏng vấn
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Mỗi người phỏng vấn sẽ có một phiếu đánh giá riêng</li>
                    <li>Chỉ người phỏng vấn mới có thể cập nhật phiếu của mình</li>
                    <li>Trạng thái ứng viên sẽ chuyển sang "Phỏng vấn"</li>
                    <li>Chỉ HR mới có quyền ra quyết định cuối cùng</li>
                    <li>Bất kỳ nhân sự nào trong công ty đều có thể được chọn làm người phỏng vấn</li>
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
              disabled={isSubmitting || selectedInterviewers.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo cuộc phỏng vấn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
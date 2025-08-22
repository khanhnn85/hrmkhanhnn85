import React, { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle, XCircle, Calendar, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Interview } from '../../types/database';
import { InterviewForm } from '../../components/Forms/InterviewForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const resultLabels = {
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800', icon: XCircle },
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

export function InterviewAssignments() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadMyInterviews();
    }
  }, [user]);

  const loadMyInterviews = async () => {
    if (!user) return;

    try {
      console.log('👤 Loading interviews for user:', user.id);
      const allInterviews = await DatabaseService.getMyInterviews(user.id);
      console.log('👤 My interviews:', allInterviews);
      setInterviews(allInterviews);
    } catch (error) {
      console.error('👤 Error loading my interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    setShowInterviewForm(true);
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesStatus = !statusFilter || interview.result === statusFilter;
    return matchesStatus;
  });

  const stats = {
    total: interviews.length,
    pending: interviews.filter(i => i.result === 'PENDING').length,
    completed: interviews.filter(i => i.result !== 'PENDING').length,
    passed: interviews.filter(i => i.result === 'PASS').length,
    failed: interviews.filter(i => i.result === 'FAIL').length,
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Phiếu phỏng vấn của tôi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các phiếu phỏng vấn được giao ({filteredInterviews.length} phiếu)
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Tổng số</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-yellow-800">Chờ xử lý</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-sm text-blue-800">Đã hoàn thành</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
          <div className="text-sm text-green-800">Đạt</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-red-800">Không đạt</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(resultLabels).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interview List */}
      <div className="space-y-4">
        {filteredInterviews.map((interview) => {
          const ResultIcon = resultLabels[interview.result].icon;
          
          return (
            <div key={interview.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Phỏng vấn: {interview.candidate?.full_name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${resultLabels[interview.result].color}`}>
                      <ResultIcon className="h-3 w-3 mr-1" />
                      {resultLabels[interview.result].label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Ứng viên: <strong>{interview.candidate?.full_name}</strong></span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Ngày tạo: {format(new Date(interview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                    </div>
                    
                    {interview.updated_at !== interview.created_at && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Cập nhật: {format(new Date(interview.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditInterview(interview)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {interview.result === 'PENDING' ? 'Cập nhật phiếu' : 'Xem phiếu'}
                  </button>
                </div>
              </div>

              {/* Interview Content Preview */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Đánh giá chuyên môn:</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        {interview.tech_notes || (
                          <span className="italic text-gray-400">
                            {interview.result === 'PENDING' ? 'Chưa có đánh giá - Click "Cập nhật phiếu" để thêm' : 'Chưa có đánh giá'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Đánh giá kỹ năng mềm:</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        {interview.soft_notes || (
                          <span className="italic text-gray-400">
                            {interview.result === 'PENDING' ? 'Chưa có đánh giá - Click "Cập nhật phiếu" để thêm' : 'Chưa có đánh giá'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {interview.result === 'PENDING' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>⏳ Phiếu chưa hoàn thành:</strong> Vui lòng cập nhật đánh giá và kết quả phỏng vấn.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredInterviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter ? 'Không có phiếu phỏng vấn nào phù hợp' : 'Chưa có phiếu phỏng vấn nào'}
            </h3>
            <p className="text-gray-500">
              {statusFilter 
                ? 'Thử thay đổi bộ lọc để xem các phiếu khác'
                : 'Các phiếu phỏng vấn được giao sẽ hiển thị ở đây'
              }
            </p>
          </div>
        )}
      </div>

      {/* Interview Form Modal */}
      {showInterviewForm && editingInterview && (
        <InterviewForm
          candidateId={editingInterview.candidate_id}
          interview={editingInterview}
          onClose={() => {
            setShowInterviewForm(false);
            setEditingInterview(null);
            loadMyInterviews();
          }}
        />
      )}
    </div>
  );
}
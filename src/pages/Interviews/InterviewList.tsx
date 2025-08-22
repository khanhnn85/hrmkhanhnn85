import React, { useState, useEffect } from 'react';
import { Eye, Calendar, Users, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '../../lib/supabase';
import { InterviewSession, Interview } from '../../types/database';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusLabels = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

const resultLabels = {
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800', icon: XCircle },
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

export function InterviewList() {
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInterviewSessions();
  }, []);

  const loadInterviewSessions = async () => {
    try {
      console.log('📋 Loading interview sessions...');
      const data = await DatabaseService.getInterviewSessionsWithDetails();
      console.log('📋 Loaded interview sessions:', data);
      setInterviewSessions(data);
    } catch (error) {
      console.error('📋 Error loading interview sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionSummary = (session: InterviewSession) => {
    const interviews = session.interviews || [];
    const passCount = interviews.filter(i => i.result === 'PASS').length;
    const failCount = interviews.filter(i => i.result === 'FAIL').length;
    const pendingCount = interviews.filter(i => i.result === 'PENDING').length;
    
    return { passCount, failCount, pendingCount, totalCount: interviews.length };
  };

  const filteredSessions = interviewSessions.filter(session => {
    const matchesStatus = !statusFilter || session.status === statusFilter;
    const matchesSearch = !searchTerm || 
      session.candidate?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý cuộc phỏng vấn</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem và theo dõi tất cả cuộc phỏng vấn ({filteredSessions.length} cuộc phỏng vấn)
          </p>
        </div>
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
              placeholder="Tên ứng viên hoặc tiêu đề cuộc phỏng vấn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
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
              {Object.entries(statusLabels).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interview Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => {
          const summary = getSessionSummary(session);
          
          return (
            <div key={session.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusLabels[session.status].color}`}>
                      {statusLabels[session.status].label}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>Ứng viên: <strong>{session.candidate?.full_name}</strong></span>
                    </div>
                    
                    {session.scheduled_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(new Date(session.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{summary.totalCount} người phỏng vấn</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Tạo bởi: {session.creator?.full_name} • {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </div>
                </div>

                <Link
                  to={`/candidates/${session.candidate_id}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Xem chi tiết
                </Link>
              </div>

              {/* Interview Results Summary */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Kết quả phỏng vấn:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-600">{summary.totalCount}</p>
                    <p className="text-xs text-gray-500">Tổng số</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{summary.passCount}</p>
                    <p className="text-xs text-green-800">Đạt</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{summary.failCount}</p>
                    <p className="text-xs text-red-800">Không đạt</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600">{summary.pendingCount}</p>
                    <p className="text-xs text-yellow-800">Đang xử lý</p>
                  </div>
                </div>

                {/* Individual Interview Results */}
                {session.interviews && session.interviews.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Chi tiết từng phiếu:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {session.interviews.map((interview, index) => {
                        const ResultIcon = resultLabels[interview.result].icon;
                        
                        return (
                          <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <ResultIcon className={`h-4 w-4 ${
                                  interview.result === 'PASS' ? 'text-green-600' :
                                  interview.result === 'FAIL' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {interview.interviewer?.full_name || `Người phỏng vấn ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {interview.interviewer?.role} • {format(new Date(interview.created_at), 'dd/MM/yyyy', { locale: vi })}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${resultLabels[interview.result].color}`}>
                              {resultLabels[interview.result].label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progress Indicator */}
                {summary.totalCount > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Tiến độ hoàn thành</span>
                      <span>{Math.round(((summary.passCount + summary.failCount) / summary.totalCount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((summary.passCount + summary.failCount) / summary.totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có cuộc phỏng vấn nào</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter 
                ? 'Không tìm thấy cuộc phỏng vấn nào phù hợp với bộ lọc'
                : 'Các cuộc phỏng vấn sẽ hiển thị ở đây sau khi được tạo'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
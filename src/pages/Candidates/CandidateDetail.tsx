import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, UserPlus, MessageSquare, Copy } from 'lucide-react';
import { DatabaseService } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Candidate, Interview, Decision } from '../../types/database';
import { InterviewForm } from '../../components/Forms/InterviewForm';
import { DecisionForm } from '../../components/Forms/DecisionForm';
import { InterviewSessionForm } from '../../components/Forms/InterviewSessionForm';
import { generateUsername, generatePassword } from '../../utils/validation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusLabels = {
  SUBMITTED: { label: 'Mới nộp', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  INTERVIEW: { label: 'Phỏng vấn', color: 'bg-yellow-100 text-yellow-800' },
  OFFERED: { label: 'Đã đề xuất', color: 'bg-purple-100 text-purple-800' },
  HIRED: { label: 'Đã tuyển', color: 'bg-green-100 text-green-800' },
  NOT_HIRED: { label: 'Không tuyển', color: 'bg-red-100 text-red-800' },
};

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [showInterviewSessionForm, setShowInterviewSessionForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [createdEmployee, setCreatedEmployee] = useState<{username: string, password: string} | null>(null);

  useEffect(() => {
    if (id) {
      loadCandidateDetail(id);
    }
  }, [id]);

  const loadCandidateDetail = async (candidateId: string) => {
    try {
      const data = await DatabaseService.getCandidateById(candidateId);
      setCandidate(data);
      setInterviews(data.interviews || []);
      setDecisions(data.decisions || []);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin ứng viên');
      navigate('/candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!candidate) return;

    try {
      await DatabaseService.updateCandidate(candidate.id, { status: newStatus });
      setCandidate({ ...candidate, status: newStatus as any });
      
      if (newStatus === 'INTERVIEW') {
        setShowInterviewForm(true);
      }
      
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Check if current user has already completed their interview
  const hasUserCompletedInterview = () => {
    if (!user) return false;
    const userInterview = interviews.find(interview => 
      interview.interviewer_id === user.id && 
      (interview.result === 'PASS' || interview.result === 'FAIL')
    );
    return !!userInterview;
  };

  // Check if user has a pending interview
  const hasUserPendingInterview = () => {
    if (!user) return false;
    const userInterview = interviews.find(interview => 
      interview.interviewer_id === user.id && 
      interview.result === 'PENDING'
    );
    return !!userInterview;
  };

  // Get current user's interview
  const getCurrentUserInterview = () => {
    if (!user) return null;
    return interviews.find(interview => interview.interviewer_id === user.id);
  };

  const handleCreateEmployee = async () => {
    if (!candidate) return;

    if (!confirm(`Bạn có chắc chắn muốn tạo tài khoản nhân viên cho "${candidate.full_name}"?`)) {
      return;
    }

    try {
      // Generate username and password
      const existingUsers = await DatabaseService.getUsersWithMockData();
      const existingUsernames = existingUsers.map(u => u.username);
      const username = generateUsername(candidate.full_name, existingUsernames);
      const password = generatePassword();

      // Create user account
      const newUser = await DatabaseService.createUser({
        username: username,
        email: candidate.email, // This should be dominhquan@company.com
        phone: candidate.phone,
        full_name: candidate.full_name,
        role: 'EMPLOYEE',
        password_hash: password, // In real app, this would be hashed
        status: 'ACTIVE'
      });
      
      console.log('✅ Created user account with email:', newUser.email);
      console.log('✅ Full user object:', newUser);

      // Create employee record
      await DatabaseService.createEmployee({
        user_id: newUser.id,
        candidate_id: candidate.id,
        place_of_residence: '',
        hometown: '',
        national_id: ''
      });

      // Update candidate status
      await DatabaseService.updateCandidate(candidate.id, { status: 'HIRED' });
      setCandidate({ ...candidate, status: 'HIRED' });
      
      // Store created employee info to display
      setCreatedEmployee({ username, password });
      
      toast.success('Tạo tài khoản nhân viên thành công!');
    } catch (error) {
      toast.error('Lỗi khi tạo tài khoản nhân viên');
    }
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return <div>Không tìm thấy ứng viên</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết ứng viên: {candidate.full_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ứng tuyển vị trí: {candidate.position?.title}
            </p>
          </div>
        </div>
        
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusLabels[candidate.status].color}`}>
          {statusLabels[candidate.status].label}
        </span>
      </div>

      {/* Candidate Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vị trí ứng tuyển</label>
              <p className="mt-1 text-sm text-gray-900">
                {candidate.position?.title} - {candidate.position?.department}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CV đính kèm</label>
              <div className="mt-1">
                <a
                  href={candidate.cv_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải xuống CV
                </a>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày nộp hồ sơ</label>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {candidate.status === 'SUBMITTED' && (role === 'HR' || role === 'ADMIN') && (
          <>
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Duyệt hồ sơ
            </button>
            <button
              onClick={() => handleStatusUpdate('REJECTED')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </button>
          </>
        )}

        {candidate.status === 'APPROVED' && (role === 'HR' || role === 'ADMIN') && (
          <button
            onClick={() => setShowInterviewSessionForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Tạo cuộc phỏng vấn
          </button>
        )}

        {candidate.status === 'INTERVIEW' && !hasUserCompletedInterview() && hasUserPendingInterview() && (
          <button
            onClick={() => setShowInterviewForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Cập nhật phiếu phỏng vấn của tôi
          </button>
        )}

        {candidate.status === 'INTERVIEW' && (role === 'HR' || role === 'ADMIN') && (
          <>
            <button
              onClick={() => setShowDecisionForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Ra quyết định
            </button>
          </>
        )}

        {candidate.status === 'APPROVED' && (role === 'HR' || role === 'ADMIN') && (
          <button
            onClick={() => setShowDecisionForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
          >
            Ra quyết định tuyển dụng
          </button>
        )}
        {candidate.status === 'OFFERED' && (role === 'HR' || role === 'ADMIN') && (
          <button
            onClick={handleCreateEmployee}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Tạo tài khoản nhân viên
          </button>
        )}
      </div>

      {/* Employee Account Created */}
      {createdEmployee && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-green-800">
              ✅ Tài khoản nhân viên đã được tạo thành công!
            </h3>
            <button
              onClick={() => setCreatedEmployee(null)}
              className="text-green-600 hover:text-green-800"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-gray-50 border rounded text-sm font-mono">
                    {createdEmployee.username}
                  </code>
                  <button
                    onClick={() => handleCopyCredentials(createdEmployee.username)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Sao chép username"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-md border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-gray-50 border rounded text-sm font-mono">
                    {createdEmployee.password}
                  </code>
                  <button
                    onClick={() => handleCopyCredentials(createdEmployee.password)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Sao chép password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Lưu ý quan trọng
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Vui lòng lưu lại thông tin đăng nhập này</li>
                      <li>Cung cấp username và password cho nhân viên</li>
                      <li>Nhân viên có thể đăng nhập tại trang chủ</li>
                      <li>Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleCopyCredentials(`Username: ${createdEmployee.username}\nPassword: ${createdEmployee.password}`)}
                className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Sao chép tất cả thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interviews */}
      {interviews.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Lịch sử phỏng vấn ({interviews.length} phiếu đánh giá)
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {interviews.map((interview, index) => (
                <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Phiếu đánh giá #{index + 1}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Người phỏng vấn: <span className="font-medium">{interview.interviewer?.full_name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(interview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        interview.result === 'PASS' ? 'bg-green-100 text-green-800' :
                        interview.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.result === 'PASS' ? 'Đạt' : interview.result === 'FAIL' ? 'Không đạt' : 'Đang xử lý'}
                      </span>
                      {((role === 'HR' || role === 'ADMIN') || (user && interview.interviewer_id === user.id)) && (
                        <button
                          onClick={() => setEditingInterview(interview)}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          {user && interview.interviewer_id === user.id ? 'Cập nhật' : 'Xem/Sửa'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Đánh giá chuyên môn:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {interview.tech_notes || 'Chưa có đánh giá'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Đánh giá kỹ năng mềm:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {interview.soft_notes || 'Chưa có đánh giá'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interview Summary */}
      {interviews.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tổng kết phỏng vấn</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {interviews.filter(i => i.result === 'PASS').length}
                </p>
                <p className="text-sm text-green-800">Đạt</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {interviews.filter(i => i.result === 'FAIL').length}
                </p>
                <p className="text-sm text-red-800">Không đạt</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {interviews.filter(i => i.result === 'PENDING').length}
                </p>
                <p className="text-sm text-yellow-800">Đang xử lý</p>
              </div>
            </div>
            
            {interviews.every(i => i.result !== 'PENDING') && interviews.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Kết quả tổng thể:</strong> Tất cả người phỏng vấn đã hoàn thành đánh giá. 
                  {(role === 'HR' || role === 'ADMIN') ? 'Bạn có thể ra quyết định tuyển dụng.' : 'HR sẽ ra quyết định tuyển dụng.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Interview Display - Remove this section */}
      {false && interviews.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lịch sử phỏng vấn</h3>
          </div>
          <div className="px-6 py-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="border-l-4 border-blue-200 pl-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Phỏng vấn bởi: {interview.interviewer?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(interview.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <strong>Chuyên môn:</strong> {interview.tech_notes}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Kỹ năng:</strong> {interview.soft_notes}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                      interview.result === 'PASS' ? 'bg-green-100 text-green-800' :
                      interview.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interview.result === 'PASS' ? 'Đạt' : interview.result === 'FAIL' ? 'Không đạt' : 'Đang xử lý'}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingInterview(interview)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quyết định tuyển dụng</h3>
          </div>
          <div className="px-6 py-4">
            {decisions.map((decision) => (
              <div key={decision.id} className="border-l-4 border-purple-200 pl-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  Quyết định: {decision.decision === 'HIRE' ? 'Tuyển' : 'Không tuyển'}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(decision.decided_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Ghi chú:</strong> {decision.decision_notes}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Quyết định bởi: {decision.decider?.full_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forms */}
      {showInterviewForm && (
        <InterviewForm
          candidateId={candidate.id}
          interview={getCurrentUserInterview()}
          onClose={() => {
            setShowInterviewForm(false);
            if (id) loadCandidateDetail(id);
          }}
        />
      )}

      {showDecisionForm && (role === 'HR' || role === 'ADMIN') && (
        <DecisionForm
          candidateId={candidate.id}
          onClose={() => {
            setShowDecisionForm(false);
            if (id) loadCandidateDetail(id);
          }}
        />
      )}

      {editingInterview && (
        <InterviewForm
          candidateId={candidate.id}
          interview={editingInterview}
          onClose={() => {
            setEditingInterview(null);
            if (id) loadCandidateDetail(id);
          }}
        />
      )}

      {showInterviewSessionForm && (role === 'HR' || role === 'ADMIN') && (
        <InterviewSessionForm
          candidateId={candidate.id}
          candidateName={candidate.full_name}
          onClose={() => {
            setShowInterviewSessionForm(false);
            if (id) loadCandidateDetail(id);
          }}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Eye, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '../../lib/supabase';
import { Candidate } from '../../types/database';
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

export function CandidateList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      console.log('📋 CandidateList: Loading candidates...');
      const data = await DatabaseService.getCandidates();
      console.log('📋 CandidateList: Loaded candidates:', data);
      setCandidates(data);
    } catch (error) {
      console.error('📋 CandidateList: Error loading candidates:', error);
      toast.error('Lỗi khi tải danh sách ứng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedCandidates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ứng viên');
      return;
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const actionText = action === 'approve' ? 'duyệt' : 'từ chối';

    try {
      await Promise.all(
        selectedCandidates.map(id =>
          DatabaseService.updateCandidate(id, { status: newStatus })
        )
      );

      toast.success(`Đã ${actionText} ${selectedCandidates.length} ứng viên`);
      setSelectedCandidates([]);
      loadCandidates();
    } catch (error) {
      toast.error(`Lỗi khi ${actionText} ứng viên`);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = !statusFilter || candidate.status === statusFilter;
    const matchesSearch = !searchTerm || 
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const exportToCsv = () => {
    const csvContent = [
      ['Họ tên', 'Email', 'SĐT', 'Vị trí', 'Trạng thái', 'Ngày nộp'],
      ...filteredCandidates.map(candidate => [
        candidate.full_name,
        candidate.email,
        candidate.phone,
        candidate.position?.title || '',
        statusLabels[candidate.status].label,
        format(new Date(candidate.created_at), 'dd/MM/yyyy', { locale: vi })
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'candidates.csv';
    link.click();
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý ứng viên</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem và quản lý hồ sơ ứng viên ({filteredCandidates.length} ứng viên)
          </p>
        </div>
        
        <button
          onClick={exportToCsv}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên hoặc email..."
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

          <div className="flex items-end space-x-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={selectedCandidates.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Duyệt sang Approved
            </button>
            
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={selectedCandidates.length === 0}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </button>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCandidates(filteredCandidates.map(c => c.id));
                    } else {
                      setSelectedCandidates([]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ứng viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vị trí
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày nộp
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCandidates([...selectedCandidates, candidate.id]);
                      } else {
                        setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {candidate.position?.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {candidate.position?.department}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusLabels[candidate.status].color}`}>
                    {statusLabels[candidate.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Link
                    to={`/candidates/${candidate.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy ứng viên nào</div>
          </div>
        )}
      </div>
    </div>
  );
}
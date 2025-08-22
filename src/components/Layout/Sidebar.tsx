import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  UserCheck, 
  Settings, 
  BarChart3,
  Building,
  ClipboardList,
  UserPlus,
  Home,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, role } = useAuth();
  const location = useLocation();

  const menuItems = {
    ADMIN: [
      { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Ứng viên', path: '/candidates' },
      { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
      { icon: Building, label: 'Vị trí tuyển dụng', path: '/positions' },
      { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
      { icon: ClipboardList, label: 'Nhật ký hoạt động', path: '/audit-logs' },
    ],
    HR: [
      { icon: FileText, label: 'Ứng viên', path: '/candidates' },
      { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
      { icon: Building, label: 'Vị trí tuyển dụng', path: '/positions' },
      { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
    ],
    EMPLOYEE: [
      { icon: Home, label: 'Trang chủ', path: '/employee' },
     { icon: UserCheck, label: 'Phiếu phỏng vấn', path: '/employee/interviews' },
      { icon: User, label: 'Hồ sơ cá nhân', path: '/employee/profile' },
    ],
    GUEST: []
  };

  const currentMenuItems = menuItems[role] || [];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-center h-16 bg-blue-600">
        <h1 className="text-xl font-bold text-white">HR System</h1>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {role === 'ADMIN' ? 'Quản trị' : role === 'HR' ? 'Nhân sự' : 'Nhân viên'}
          </p>
        </div>
        
        <ul className="mt-4">
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.full_name}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
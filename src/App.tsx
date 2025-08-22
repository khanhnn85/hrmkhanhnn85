import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { CandidateApplicationForm } from './components/Forms/CandidateApplicationForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { CandidateList } from './pages/Candidates/CandidateList';
import { CandidateDetail } from './pages/Candidates/CandidateDetail';
import { InterviewList } from './pages/Interviews/InterviewList';
import { UserList } from './pages/Users/UserList';
import { EmployeeProfile } from './pages/Employee/EmployeeProfile';
import { InterviewAssignments } from './pages/Employee/InterviewAssignments';
import { Unauthorized } from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/apply" element={<CandidateApplicationForm />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/candidates" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <Layout>
                  <CandidateList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <Layout>
                  <CandidateDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/interviews" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <Layout>
                  <InterviewList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <Layout>
                  <UserList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/employee" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900">Chào mừng nhân viên</h1>
                    <p className="mt-2 text-gray-600">Cổng thông tin nhân viên</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <Layout>
                  <EmployeeProfile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/employee/interviews" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <Layout>
                  <InterviewAssignments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AuthRedirect() {
  const { user, role } = useAuth();
  
  console.log('🔄 AuthRedirect - User:', user?.email, 'Role:', role);
  
  if (!user) {
    console.log('🔄 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (role === 'ADMIN') {
    console.log('🔄 Admin user, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else if (role === 'HR') {
    console.log('🔄 HR user, redirecting to candidates');
    return <Navigate to="/candidates" replace />;
  } else if (role === 'EMPLOYEE') {
    console.log('🔄 Employee user, redirecting to employee');
    return <Navigate to="/employee" replace />;
  }
  
  console.log('🔄 Unknown role, redirecting to login');
  return <Navigate to="/login" replace />;
}

export default App;
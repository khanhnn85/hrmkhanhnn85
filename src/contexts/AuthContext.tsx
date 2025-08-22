import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const role: UserRole = user?.role || 'GUEST';

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Lỗi khi tải thông tin người dùng');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if this is a demo user first
      const demoUsers = {
        'admin@company.com': {
          id: 'demo-admin-id',
          username: 'admin',
          email: 'admin@company.com',
          phone: '0123456789',
          full_name: 'System Administrator',
          role: 'ADMIN' as UserRole,
          password_hash: null,
          status: 'ACTIVE' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        'hr@company.com': {
          id: 'demo-hr-id',
          username: 'hr',
          email: 'hr@company.com',
          phone: '0123456788',
          full_name: 'HR Manager',
          role: 'HR' as UserRole,
          password_hash: null,
          status: 'ACTIVE' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      const demoUser = demoUsers[email.toLowerCase() as keyof typeof demoUsers];
      
      if (demoUser) {
        // Demo user login - accept any password
        setUser(demoUser);
        toast.success('Đăng nhập thành công!');
        
        // Navigate based on role
        setTimeout(() => {
          if (demoUser.role === 'ADMIN') {
            window.location.href = '/dashboard';
          } else if (demoUser.role === 'HR') {
            window.location.href = '/candidates';
          } else if (demoUser.role === 'EMPLOYEE') {
            window.location.href = '/employee';
          }
        }, 100);
        return;
      }

      // First try to find user in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'ACTIVE')
        .single();

      if (userError || !userData) {
        toast.error('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
        throw new Error('User not found');
      }

      // For demo purposes, we'll accept any password for existing users
      // In production, you would verify the password hash
      setUser(userData);
      toast.success('Đăng nhập thành công!');
      
      // Navigate based on role
      setTimeout(() => {
        if (userData.role === 'ADMIN') {
          window.location.href = '/dashboard';
        } else if (userData.role === 'HR') {
          window.location.href = '/candidates';
        } else if (userData.role === 'EMPLOYEE') {
          window.location.href = '/employee';
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      try {
        // If database login fails, still show helpful error
        toast.error('Email hoặc mật khẩu không đúng');
      } catch (error) {
        toast.error('Lỗi đăng nhập');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      toast.success('Đã đăng xuất');
    } catch (error: any) {
      // Even if Supabase signOut fails, clear local user state
      setUser(null);
      toast.error('Lỗi khi đăng xuất');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      toast.success('Cập nhật thông tin thành công!');
    } catch (error: any) {
      toast.error('Lỗi khi cập nhật thông tin');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    role,
    loading,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
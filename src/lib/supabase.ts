import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database service functions
export class DatabaseService {
  // User management
  static async createUser(userData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getUsersWithMockData() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Position management
  static async getPositions() {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getOpenPositions() {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading open positions:', error);
      throw error;
    }
  }

  // Candidate management
  static async createCandidate(candidateData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([candidateData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  static async getCandidates() {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          position:positions(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading candidates:', error);
      throw error;
    }
  }

  static async getCandidateById(id: string) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          position:positions(*),
          interviews:interviews(
            *,
            interviewer:users(*)
          ),
          decisions:decisions(
            *,
            decider:users(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading candidate:', error);
      throw error;
    }
  }

  static async updateCandidate(id: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  }

  // Interview management
  static async createInterviewSession(sessionData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert([{
          ...sessionData,
          status: 'SCHEDULED'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }

  static async getMyInterviews(userId: string) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .eq('interviewer_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading my interviews:', error);
      throw error;
    }
  }

  static async getInterviewSessions() {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading interview sessions:', error);
      throw error;
    }
  }

  static async getInterviewSessionsWithDetails() {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          candidate:candidates(*),
          creator:users!interview_sessions_created_by_fkey(*),
          interviews:interviews(
            *,
            interviewer:users(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading interview sessions with details:', error);
      throw error;
    }
  }

  static async createInterview(interviewData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert([interviewData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  }

  static async updateInterview(id: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  }

  static async getInterviews() {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate:candidates(*),
          interviewer:users(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading interviews:', error);
      throw error;
    }
  }

  // Decision management
  static async createDecision(decisionData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .insert([decisionData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating decision:', error);
      throw error;
    }
  }

  // Employee management
  static async createEmployee(employeeData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async getEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          user:users(*),
          candidate:candidates(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading employees:', error);
      throw error;
    }
  }

  // Audit logs
  static async createAuditLog(logData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([logData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  // Statistics
  static async getStatistics() {
    try {
      // Get candidates statistics
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('status');
      
      if (candidatesError) throw candidatesError;
      
      // Get interviews statistics
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select('result');
      
      if (interviewsError) throw interviewsError;
      
      // Get new employees count (created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: newEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (employeesError) throw employeesError;
      
      return {
        candidates: candidates || [],
        interviews: interviews || [],
        newEmployees: newEmployees?.length || 0
      };
    } catch (error) {
      console.error('Error loading statistics:', error);
      throw error;
    }
  }
}
/*
  # Hệ thống quản trị tuyển dụng - nhân sự

  ## 1. Bảng dữ liệu
  - `users` - Tài khoản người dùng (Admin, HR, Employee)
  - `positions` - Vị trí tuyển dụng  
  - `candidates` - Ứng viên nộp hồ sơ
  - `interviews` - Phiếu phỏng vấn
  - `decisions` - Quyết định tuyển dụng
  - `employees` - Hồ sơ nhân viên
  - `audit_logs` - Nhật ký thao tác

  ## 2. Bảo mật
  - Enable RLS cho tất cả bảng
  - Policies phân quyền theo role
  - Unique constraints ngăn trùng lặp
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'HR', 'EMPLOYEE')),
  password_hash text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  department text NOT NULL,
  description text NOT NULL,
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cv_url text,
  applied_position_id uuid NOT NULL REFERENCES positions(id),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'REJECTED', 'APPROVED', 'INTERVIEW', 'OFFERED', 'HIRED', 'NOT_HIRED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, applied_position_id)
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL REFERENCES candidates(id),
  interviewer_id uuid NOT NULL REFERENCES users(id),
  tech_notes text NOT NULL,
  soft_notes text NOT NULL,
  result text NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PASS', 'FAIL', 'PENDING')),
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL REFERENCES candidates(id),
  decided_by uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('HIRE', 'NO_HIRE')),
  decision_notes text NOT NULL,
  decided_at timestamptz DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  candidate_id uuid REFERENCES candidates(id),
  place_of_residence text NOT NULL DEFAULT '',
  hometown text NOT NULL DEFAULT '',
  national_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  payload_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_candidates_email_position ON candidates(email, applied_position_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "HR and Admin can read all users" ON users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

CREATE POLICY "Admin can manage users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Positions policies  
CREATE POLICY "Anyone can read open positions" ON positions
  FOR SELECT TO anon, authenticated
  USING (is_open = true);

CREATE POLICY "HR and Admin can read all positions" ON positions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

CREATE POLICY "Admin can manage positions" ON positions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Candidates policies
CREATE POLICY "Anyone can create candidates" ON candidates
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "HR and Admin can read all candidates" ON candidates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

CREATE POLICY "HR and Admin can update candidates" ON candidates
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

-- Interviews policies
CREATE POLICY "HR and Admin can manage interviews" ON interviews
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

-- Decisions policies
CREATE POLICY "HR and Admin can manage decisions" ON decisions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

-- Employees policies
CREATE POLICY "Users can read own employee data" ON employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own employee data" ON employees
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "HR and Admin can manage employees" ON employees
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

-- Audit logs policies
CREATE POLICY "HR and Admin can read audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('HR', 'ADMIN')
  ));

CREATE POLICY "Anyone can create audit logs" ON audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Seed data
INSERT INTO positions (title, department, description, is_open) VALUES
  ('Backend Developer', 'Engineering', 'Phát triển các API và hệ thống backend', true),
  ('Frontend Developer', 'Engineering', 'Phát triển giao diện người dùng với React/Vue', true),
  ('HR Generalist', 'Human Resources', 'Quản lý tuyển dụng và nhân sự', true);

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, phone, full_name, role, password_hash, status) VALUES
  ('admin', 'admin@company.com', '0912345678', 'Quản trị viên', 'ADMIN', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ACTIVE'),
  ('hr01', 'hr@company.com', '0987654321', 'Nguyễn Thị HR', 'HR', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ACTIVE');
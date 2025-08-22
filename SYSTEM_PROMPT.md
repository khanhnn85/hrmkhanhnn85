# HỆ THỐNG QUẢN LÝ TUYỂN DỤNG VÀ NHÂN SỰ - PROMPT HOÀN CHỈNH

Tạo một hệ thống quản lý tuyển dụng và nhân sự hoàn chỉnh với React + TypeScript + Tailwind CSS + Supabase.

## 1. KIẾN TRÚC HỆ THỐNG

### Frontend Stack:
- **React 18** + **TypeScript** (strict mode)
- **Tailwind CSS** cho styling với custom design system
- **React Router DOM** cho navigation và protected routes
- **React Hook Form** + **Zod** cho form validation
- **React Hot Toast** cho notifications
- **Lucide React** cho icons (không dùng icon libraries khác)
- **Recharts** cho biểu đồ và statistics
- **date-fns** cho date formatting (locale vi)

### Backend & Database:
- **Supabase** (PostgreSQL database)
- **Row Level Security (RLS)** cho bảo mật
- **Real-time subscriptions** cho data consistency
- **Supabase Auth** cho authentication
- **Supabase Storage** cho file uploads

### Development Tools:
- **Vite** cho build tool
- **ESLint** + **TypeScript ESLint** cho code quality
- **PostCSS** + **Autoprefixer**

## 2. CƠ SỞ DỮ LIỆU SUPABASE

### Database Schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Quản lý tài khoản người dùng)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Positions table (Vị trí tuyển dụng)
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  description text NOT NULL,
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table (Ứng viên)
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cv_url text,
  applied_position_id uuid REFERENCES positions(id),
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'REJECTED', 'APPROVED', 'INTERVIEW', 'OFFERED', 'HIRED', 'NOT_HIRED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, applied_position_id)
);

-- Interview sessions table (Cuộc phỏng vấn)
CREATE TABLE interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  title text NOT NULL,
  scheduled_date timestamptz,
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interviews table (Phiếu đánh giá phỏng vấn)
CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  interviewer_id uuid REFERENCES users(id),
  interview_session_id uuid REFERENCES interview_sessions(id),
  tech_notes text NOT NULL,
  soft_notes text NOT NULL,
  result text NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PASS', 'FAIL', 'PENDING')),
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Decisions table (Quyết định tuyển dụng)
CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id),
  decided_by uuid REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('HIRE', 'NO_HIRE')),
  decision_notes text NOT NULL,
  decided_at timestamptz DEFAULT now()
);

-- Employees table (Nhân viên)
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  candidate_id uuid REFERENCES candidates(id),
  place_of_residence text DEFAULT '',
  hometown text DEFAULT '',
  national_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table (Nhật ký hoạt động)
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  payload_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_email_position ON candidates(email, applied_position_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Row Level Security (RLS) Policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "HR and Admin can read all users" ON users FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);
CREATE POLICY "Admin can manage users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Positions policies
CREATE POLICY "Anyone can read open positions" ON positions FOR SELECT TO anon, authenticated USING (is_open = true);
CREATE POLICY "HR and Admin can read all positions" ON positions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);
CREATE POLICY "Admin can manage positions" ON positions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Candidates policies
CREATE POLICY "Allow anonymous candidate applications" ON candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "HR and Admin can read all candidates" ON candidates FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);
CREATE POLICY "HR and Admin can update candidates" ON candidates FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Interviews policies
CREATE POLICY "HR and Admin can manage interviews" ON interviews FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Decisions policies
CREATE POLICY "HR and Admin can manage decisions" ON decisions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Employees policies
CREATE POLICY "Users can read own employee data" ON employees FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own employee data" ON employees FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "HR and Admin can manage employees" ON employees FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);

-- Audit logs policies
CREATE POLICY "Anyone can create audit logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "HR and Admin can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('HR', 'ADMIN'))
);
```

## 3. PHÂN QUYỀN VÀ AUTHENTICATION

### User Roles:
- **ADMIN**: Toàn quyền truy cập, quản lý users, xem dashboard
- **HR**: Quản lý candidates, interviews, employees, positions
- **EMPLOYEE**: Xem/cập nhật thông tin cá nhân, phiếu phỏng vấn được giao
- **GUEST**: Chỉ có thể nộp hồ sơ ứng tuyển

### Demo Users:
```typescript
const demoUsers = {
  'admin@company.com': { role: 'ADMIN', password: 'admin123' },
  'hr@company.com': { role: 'HR', password: 'admin123' }
};
```

### Authentication Flow:
1. Check demo users first
2. Query database for real users
3. Verify password (mock for demo)
4. Set user context and redirect based on role

## 4. CHỨC NĂNG CHI TIẾT

### A. ADMIN Dashboard (`/dashboard`):
```typescript
interface DashboardStats {
  totalCandidates: number;
  submittedCandidates: number;
  interviewCandidates: number;
  hiredCandidates: number;
  totalInterviews: number;
  passedInterviews: number;
  newEmployees: number;
}
```

**Features:**
- Pie chart phân bố trạng thái ứng viên
- Bar chart kết quả phỏng vấn và tỉ lệ đạt
- Statistics cards với icons
- Recent activity timeline
- Responsive grid layout

### B. Quản lý ứng viên (`/candidates`):

**CandidateList Features:**
- Data table với sorting, filtering, search
- Bulk actions: approve/reject multiple candidates
- Status badges với color coding
- Export to CSV functionality
- Pagination và infinite scroll

**CandidateDetail Features:**
- Complete candidate information
- Interview history với timeline
- Decision history
- Action buttons based on status và user role
- File download (CV)
- Status transition workflow

**Workflow States:**
```
SUBMITTED → APPROVED → INTERVIEW → OFFERED → HIRED
     ↓         ↓          ↓         ↓
  REJECTED  REJECTED  NOT_HIRED  NOT_HIRED
```

### C. Quản lý phỏng vấn (`/interviews`):

**InterviewSessionForm:**
- Tạo cuộc phỏng vấn với multiple interviewers
- Schedule date/time
- Auto-create individual interview records
- Update candidate status to INTERVIEW

**InterviewList:**
- Hiển thị tất cả interview sessions
- Progress tracking cho mỗi session
- Summary statistics (pass/fail/pending)
- Filter by status và search

**InterviewForm (cho từng interviewer):**
- Technical assessment notes
- Soft skills assessment notes
- Result: PASS/FAIL/PENDING
- File attachments
- Auto-save drafts

### D. Employee Features (`/employee/*`):

**InterviewAssignments (`/employee/interviews`):**
- Danh sách phiếu phỏng vấn được giao
- Statistics dashboard (pending, completed, pass/fail)
- Filter by result status
- Update interview forms
- Preview assessment content

**EmployeeProfile (`/employee/profile`):**
- View account information (read-only)
- Update personal information:
  - Place of residence
  - Hometown
  - National ID (12 digits validation)
- Form validation với Zod

### E. Quản lý người dùng (`/users`):

**UserList Features:**
- Combined user + employee information
- Role-based filtering
- Status management (ACTIVE/DISABLED)
- Password reset functionality
- Employee detail modal

**UserForm:**
- Auto-generate username từ Vietnamese names
- Auto-generate strong passwords
- Role assignment
- Phone/email validation
- Duplicate checking

**Employee Management:**
- Create employee records từ hired candidates
- Personal information management
- Link candidate → user → employee

### F. Form ứng tuyển công khai (`/apply`):

**CandidateApplicationForm:**
- Public form (no authentication required)
- File upload với validation:
  - Types: PDF, DOC, DOCX
  - Max size: 10MB
  - Drag & drop support
- Position selection từ open positions
- Complete form validation
- Success/error handling

## 5. VALIDATION VÀ ERROR HANDLING

### Zod Validation Schemas:

```typescript
// Candidate validation
export const candidateSchema = z.object({
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{9,12}$/, 'Số điện thoại phải từ 9-12 số'),
  applied_position_id: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
});

// Interview validation
export const interviewSchema = z.object({
  tech_notes: z.string().min(10, 'Nội dung phỏng vấn chuyên môn phải có ít nhất 10 ký tự'),
  soft_notes: z.string().min(10, 'Nội dung phỏng vấn kỹ năng phải có ít nhất 10 ký tự'),
  result: z.enum(['PASS', 'FAIL', 'PENDING']),
});

// Employee validation
export const employeeSchema = z.object({
  place_of_residence: z.string().min(5, 'Chỗ ở phải có ít nhất 5 ký tự'),
  hometown: z.string().min(5, 'Quê quán phải có ít nhất 5 ký tự'),
  national_id: z.string().regex(/^\d{12}$/, 'Căn cước công dân phải có đúng 12 số'),
});

// User validation
export const userSchema = z.object({
  username: z.string().min(3, 'Username phải có ít nhất 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{9,12}$/, 'Số điện thoại phải từ 9-12 số'),
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']),
});
```

### Vietnamese Name Processing:
```typescript
export const generateUsername = (fullName: string, existingUsernames: string[] = []): string => {
  // Convert Vietnamese to English, handle duplicates
  let username = fullName
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
  
  // Handle duplicates with number suffix
  let finalUsername = username;
  let counter = 1;
  while (existingUsernames.includes(finalUsername)) {
    finalUsername = `${username}${counter}`;
    counter++;
  }
  return finalUsername;
};
```

### Error Handling:
- Toast notifications cho all user actions
- Form field validation errors
- Network error handling với retry logic
- Graceful fallbacks cho missing data
- Loading states cho async operations

## 6. DESIGN SYSTEM VÀ UI/UX

### Design Principles:
- **Apple-level aesthetics**: Clean, sophisticated, attention to detail
- **Consistent spacing**: 8px grid system
- **Typography hierarchy**: 3 font weights maximum
- **Color system**: 6 color ramps (primary, secondary, accent, success, warning, error)
- **Responsive design**: Mobile-first approach

### Component Architecture:

```typescript
// Layout Components
- Layout (main wrapper)
- Header (user info, notifications, logout)
- Sidebar (role-based navigation)
- ProtectedRoute (role-based access control)

// Form Components
- CandidateApplicationForm (public)
- UserForm (create/edit users)
- InterviewForm (assessment form)
- InterviewSessionForm (create interview sessions)
- DecisionForm (hire/no-hire decisions)
- PasswordResetForm (admin function)

// Modal Components
- EmployeeDetailModal (view/edit employee info)

// Data Display
- Statistics cards với icons
- Data tables với sorting/filtering
- Status badges với consistent colors
- Progress indicators
- Charts (Pie, Bar) với Recharts
```

### Status Color Coding:
```typescript
const statusLabels = {
  // Candidate statuses
  SUBMITTED: { label: 'Mới nộp', color: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  INTERVIEW: { label: 'Phỏng vấn', color: 'bg-yellow-100 text-yellow-800' },
  OFFERED: { label: 'Đã đề xuất', color: 'bg-purple-100 text-purple-800' },
  HIRED: { label: 'Đã tuyển', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  NOT_HIRED: { label: 'Không tuyển', color: 'bg-red-100 text-red-800' },
  
  // Interview results
  PASS: { label: 'Đạt', color: 'bg-green-100 text-green-800' },
  FAIL: { label: 'Không đạt', color: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
  
  // User statuses
  ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
  DISABLED: { label: 'Vô hiệu hóa', color: 'bg-red-100 text-red-800' },
};
```

### Responsive Breakpoints:
```css
/* Mobile first approach */
sm: '640px',   /* Small devices */
md: '768px',   /* Medium devices */
lg: '1024px',  /* Large devices */
xl: '1280px',  /* Extra large devices */
2xl: '1536px'  /* 2X Extra large devices */
```

## 7. SUPABASE INTEGRATION

### Database Service Class:

```typescript
export class DatabaseService {
  // User management
  static async createUser(userData: Partial<User>): Promise<User>
  static async getUsers(): Promise<User[]>
  static async updateUser(id: string, updates: Partial<User>): Promise<User>
  static async deleteUser(id: string): Promise<void>
  
  // Candidate management
  static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate>
  static async getCandidates(): Promise<Candidate[]>
  static async getCandidateById(id: string): Promise<Candidate>
  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate>
  
  // Interview management
  static async createInterviewSession(sessionData: Partial<InterviewSession>): Promise<InterviewSession>
  static async getInterviewSessionsWithDetails(): Promise<InterviewSession[]>
  static async createInterview(interviewData: Partial<Interview>): Promise<Interview>
  static async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview>
  static async getMyInterviews(userId: string): Promise<Interview[]>
  
  // Employee management
  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee>
  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee>
  static async getEmployees(): Promise<Employee[]>
  
  // Statistics
  static async getStatistics(): Promise<StatisticsData>
  
  // Position management
  static async getOpenPositions(): Promise<Position[]>
  
  // Decision management
  static async createDecision(decisionData: Partial<Decision>): Promise<Decision>
}
```

### TypeScript Types:

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  password_hash?: string;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cv_url: string;
  applied_position_id: string;
  status: 'SUBMITTED' | 'REJECTED' | 'APPROVED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'NOT_HIRED';
  created_at: string;
  updated_at: string;
  position?: Position;
  interviews?: Interview[];
  decisions?: Decision[];
}

export interface Interview {
  id: string;
  candidate_id: string;
  interviewer_id: string;
  interview_session_id?: string;
  tech_notes: string;
  soft_notes: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviewer?: User;
}

export interface InterviewSession {
  id: string;
  candidate_id: string;
  title: string;
  scheduled_date?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviews?: Interview[];
  creator?: User;
}

// ... other interfaces
```

## 8. ROUTING VÀ NAVIGATION

### Route Structure:
```typescript
const routes = {
  // Public routes
  '/login': LoginForm,
  '/apply': CandidateApplicationForm,
  '/unauthorized': Unauthorized,
  
  // Admin routes
  '/dashboard': Dashboard, // ADMIN only
  
  // HR + Admin routes
  '/candidates': CandidateList,
  '/candidates/:id': CandidateDetail,
  '/interviews': InterviewList,
  '/users': UserList,
  
  // Employee routes
  '/employee': EmployeeDashboard,
  '/employee/profile': EmployeeProfile,
  '/employee/interviews': InterviewAssignments,
};
```

### Protected Route Implementation:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}
```

### Sidebar Navigation:
```typescript
const menuItems = {
  ADMIN: [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Ứng viên', path: '/candidates' },
    { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
    { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
  ],
  HR: [
    { icon: FileText, label: 'Ứng viên', path: '/candidates' },
    { icon: UserCheck, label: 'Phỏng vấn', path: '/interviews' },
    { icon: Settings, label: 'Quản lý người dùng', path: '/users' },
  ],
  EMPLOYEE: [
    { icon: Home, label: 'Trang chủ', path: '/employee' },
    { icon: UserCheck, label: 'Phiếu phỏng vấn', path: '/employee/interviews' },
    { icon: User, label: 'Hồ sơ cá nhân', path: '/employee/profile' },
  ],
};
```

## 9. TESTING VÀ DEVELOPMENT TOOLS

### Auto-fill Testing System:
```typescript
// Sample data for testing
export const sampleCandidates = [
  {
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0912345678",
    position_title: "Backend Developer"
  },
  // ... more sample data
];

// Auto-fill functions
export const autoFillForm = async (candidateData, positions, retryCount = 0): Promise<boolean>
export const autoSubmitForm = async (retryCount = 0): Promise<boolean>
export const runAutoFormFiller = async (positions, candidateIndex = 0): Promise<void>

// Console commands
window.autoFormFiller = {
  runAutoFormFiller,
  stopAutoFill,
  checkFormStatus,
  fixValidationErrors
};
```

### Test Scenarios:
```typescript
export class RecruitmentTestScenarios {
  static async testFullRecruitmentWorkflow(): Promise<TestScenario[]>
  static getValidationTestCases(): ValidationTestCase[]
  static getPermissionTestCases(): PermissionTestCase[]
  static getUsernameGenerationTestCases(): UsernameTestCase[]
}
```

### Development Console Commands:
```javascript
// Available in browser console
RecruitmentTestScenarios.runConsoleTests()
autoFormFiller.runAutoFormFiller(positions)
autoFormFiller.checkFormStatus()
```

## 10. FILE STRUCTURE

```
src/
├── components/
│   ├── Auth/
│   │   └── LoginForm.tsx
│   ├── Forms/
│   │   ├── CandidateApplicationForm.tsx
│   │   ├── UserForm.tsx
│   │   ├── InterviewForm.tsx
│   │   ├── InterviewSessionForm.tsx
│   │   ├── DecisionForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── Layout/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── Modals/
│   │   └── EmployeeDetailModal.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── Candidates/
│   │   ├── CandidateList.tsx
│   │   └── CandidateDetail.tsx
│   ├── Employee/
│   │   ├── EmployeeProfile.tsx
│   │   └── InterviewAssignments.tsx
│   ├── Interviews/
│   │   └── InterviewList.tsx
│   ├── Users/
│   │   └── UserList.tsx
│   ├── Dashboard.tsx
│   └── Unauthorized.tsx
├── types/
│   └── database.ts
├── utils/
│   ├── validation.ts
│   ├── autoFormFiller.ts
│   ├── testScenarios.ts
│   └── email.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 11. ENVIRONMENT SETUP

### Required Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Package.json Dependencies:
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.1",
    "@supabase/supabase-js": "^2.56.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.62.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^6.25.1",
    "recharts": "^3.1.2",
    "zod": "^4.0.17"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

### Tailwind Configuration:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        // 8px grid system
      },
      colors: {
        // Custom color palette
      },
      fontFamily: {
        // Custom fonts
      }
    },
  },
  plugins: [],
};
```

## 12. DEPLOYMENT VÀ PRODUCTION

### Build Configuration:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Production Checklist:
- [ ] RLS policies properly configured
- [ ] Environment variables set
- [ ] Database indexes created
- [ ] File upload to Supabase Storage configured
- [ ] Email service integration (optional)
- [ ] Error monitoring setup
- [ ] Performance optimization
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Backup strategy implemented

### Performance Optimizations:
- Code splitting với React.lazy()
- Image optimization
- Bundle size analysis
- Database query optimization
- Caching strategies
- CDN setup for static assets

## 13. SECURITY CONSIDERATIONS

### Data Protection:
- Input sanitization
- SQL injection prevention (via Supabase)
- XSS protection
- CSRF protection
- File upload security
- Password hashing (production)

### Access Control:
- Role-based permissions
- Route protection
- API endpoint security
- Session management
- Audit logging

### Privacy Compliance:
- Data retention policies
- User consent management
- Data export functionality
- Right to deletion
- Privacy policy implementation

## 14. MAINTENANCE VÀ MONITORING

### Logging:
- Application errors
- User actions
- Performance metrics
- Security events
- Database queries

### Monitoring:
- Uptime monitoring
- Performance tracking
- Error rate monitoring
- User analytics
- Database performance

### Backup Strategy:
- Database backups
- File storage backups
- Configuration backups
- Disaster recovery plan

---

## IMPLEMENTATION NOTES

### Critical Requirements:
1. **Database-first approach**: Tất cả data operations qua Supabase
2. **Type safety**: Strict TypeScript, proper interfaces
3. **Error handling**: Comprehensive error handling và user feedback
4. **Responsive design**: Mobile-first, works on all devices
5. **Accessibility**: WCAG compliance, keyboard navigation
6. **Performance**: Fast loading, optimized queries
7. **Security**: RLS policies, input validation, secure authentication

### Development Workflow:
1. Set up Supabase project và database schema
2. Configure environment variables
3. Implement authentication system
4. Create database service layer
5. Build UI components với proper validation
6. Implement role-based routing
7. Add testing utilities
8. Performance optimization
9. Security audit
10. Production deployment

### Testing Strategy:
- Unit tests cho utility functions
- Integration tests cho database operations
- E2E tests cho critical user flows
- Manual testing với different user roles
- Performance testing
- Security testing

Hệ thống này cung cấp một giải pháp hoàn chỉnh cho quản lý tuyển dụng và nhân sự, với architecture scalable và maintainable, sẵn sàng cho production deployment.
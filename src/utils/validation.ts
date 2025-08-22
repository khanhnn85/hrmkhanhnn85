import { z } from 'zod';

// Validation schemas
export const candidateSchema = z.object({
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{9,12}$/, 'Số điện thoại phải từ 9-12 số'),
  applied_position_id: z.string().min(1, 'Vui lòng chọn vị trí ứng tuyển'),
});

export const interviewSchema = z.object({
  tech_notes: z.string().min(10, 'Nội dung phỏng vấn chuyên môn phải có ít nhất 10 ký tự'),
  soft_notes: z.string().min(10, 'Nội dung phỏng vấn kỹ năng phải có ít nhất 10 ký tự'),
  result: z.enum(['PASS', 'FAIL', 'PENDING']),
});

export const decisionSchema = z.object({
  decision: z.enum(['HIRE', 'NO_HIRE']),
  decision_notes: z.string().min(10, 'Ghi chú phải có ít nhất 10 ký tự'),
});

export const employeeSchema = z.object({
  place_of_residence: z.string().min(5, 'Chỗ ở phải có ít nhất 5 ký tự'),
  hometown: z.string().min(5, 'Quê quán phải có ít nhất 5 ký tự'),
  national_id: z.string().regex(/^\d{12}$/, 'Căn cước công dân phải có đúng 12 số'),
});

export const userSchema = z.object({
  username: z.string().min(3, 'Username phải có ít nhất 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{9,12}$/, 'Số điện thoại phải từ 9-12 số'),
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// File validation
export const validateFile = (file: File) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file PDF, DOC, DOCX');
  }

  if (file.size > maxSize) {
    throw new Error('Kích thước file không được vượt quá 10MB');
  }

  return true;
};

// Username generation
export const generateUsername = (fullName: string, existingUsernames: string[] = []): string => {
  // Convert Vietnamese to English
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd'
  };

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

  // Check for duplicates and add number suffix
  let finalUsername = username;
  let counter = 1;
  
  while (existingUsernames.includes(finalUsername)) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  return finalUsername;
};

// Password generation
export const generatePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const all = uppercase + lowercase + numbers + special;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  for (let i = 0; i < 7; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
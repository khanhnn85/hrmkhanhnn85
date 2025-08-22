// Kịch bản test tự động cho hệ thống tuyển dụng
export class RecruitmentTestScenarios {
  
  // Kịch bản 1: Test toàn bộ workflow tuyển dụng
  static async testFullRecruitmentWorkflow() {
    console.log('🎯 Bắt đầu test toàn bộ workflow tuyển dụng...\n');
    
    const scenarios = [
      {
        step: 1,
        description: 'Ứng viên nộp hồ sơ',
        action: 'Tự động điền và submit form ứng tuyển',
        expectedResult: 'Tạo record candidate với status=SUBMITTED'
      },
      {
        step: 2,
        description: 'HR duyệt hồ sơ',
        action: 'Đăng nhập HR, duyệt ứng viên sang phỏng vấn',
        expectedResult: 'Status chuyển thành INTERVIEW'
      },
      {
        step: 3,
        description: 'Tạo phiếu phỏng vấn',
        action: 'Tạo interview record với kết quả PASS',
        expectedResult: 'Lưu thông tin phỏng vấn thành công'
      },
      {
        step: 4,
        description: 'Ra quyết định tuyển dụng',
        action: 'Quyết định HIRE',
        expectedResult: 'Status=OFFERED, gửi email trúng tuyển'
      },
      {
        step: 5,
        description: 'Tạo tài khoản nhân viên',
        action: 'Chuyển ứng viên thành nhân viên',
        expectedResult: 'Tạo user account + employee record'
      },
      {
        step: 6,
        description: 'Nhân viên cập nhật thông tin',
        action: 'Đăng nhập và cập nhật hồ sơ cá nhân',
        expectedResult: 'Cập nhật thông tin thành công'
      }
    ];

    scenarios.forEach(scenario => {
      console.log(`📋 Bước ${scenario.step}: ${scenario.description}`);
      console.log(`   Hành động: ${scenario.action}`);
      console.log(`   Kết quả mong đợi: ${scenario.expectedResult}\n`);
    });

    return scenarios;
  }

  // Kịch bản 2: Test validation form
  static getValidationTestCases() {
    return [
      {
        testCase: 'Email không hợp lệ',
        data: {
          full_name: 'Nguyễn Văn A',
          email: 'invalid-email',
          phone: '0912345678',
          applied_position_id: 'valid-id'
        },
        expectedError: 'Email không hợp lệ'
      },
      {
        testCase: 'Số điện thoại không hợp lệ',
        data: {
          full_name: 'Nguyễn Văn B',
          email: 'valid@email.com',
          phone: '123', // Quá ngắn
          applied_position_id: 'valid-id'
        },
        expectedError: 'Số điện thoại phải từ 9-12 số'
      },
      {
        testCase: 'Họ tên quá ngắn',
        data: {
          full_name: 'A', // Quá ngắn
          email: 'valid@email.com',
          phone: '0912345678',
          applied_position_id: 'valid-id'
        },
        expectedError: 'Họ và tên phải có ít nhất 2 ký tự'
      },
      {
        testCase: 'Chưa chọn vị trí',
        data: {
          full_name: 'Nguyễn Văn C',
          email: 'valid@email.com',
          phone: '0912345678',
          applied_position_id: '' // Chưa chọn
        },
        expectedError: 'Vui lòng chọn vị trí ứng tuyển'
      }
    ];
  }

  // Kịch bản 3: Test phân quyền
  static getPermissionTestCases() {
    return [
      {
        role: 'GUEST',
        allowedPages: ['/apply'],
        blockedPages: ['/dashboard', '/candidates', '/employees', '/users']
      },
      {
        role: 'EMPLOYEE',
        allowedPages: ['/employee', '/employee/profile'],
        blockedPages: ['/dashboard', '/candidates', '/users']
      },
      {
        role: 'HR',
        allowedPages: ['/candidates', '/interviews', '/employees', '/positions'],
        blockedPages: ['/dashboard', '/users']
      },
      {
        role: 'ADMIN',
        allowedPages: ['/dashboard', '/candidates', '/interviews', '/employees', '/positions', '/users', '/audit-logs'],
        blockedPages: []
      }
    ];
  }

  // Kịch bản 4: Test sinh username
  static getUsernameGenerationTestCases() {
    return [
      {
        input: 'Nguyễn Văn An',
        expected: 'nguyenvanan',
        description: 'Chuyển đổi tiếng Việt có dấu'
      },
      {
        input: 'Trần Thị Bình',
        expected: 'tranthibinh',
        description: 'Xử lý tên có "Thị"'
      },
      {
        input: 'Lê Hoàng Cường',
        expected: 'lehoangcuong',
        description: 'Xử lý ký tự đặc biệt'
      },
      {
        input: 'Phạm Đức Em',
        expected: 'phamducem',
        description: 'Xử lý chữ "đ"'
      },
      {
        input: 'Hoàng Văn An', // Trùng với test case 1
        expected: 'hoangvanan1',
        description: 'Xử lý trùng lặp với hậu tố số'
      }
    ];
  }

  // Hàm chạy test console
  static runConsoleTests() {
    console.log('🧪 RECRUITMENT SYSTEM TEST SCENARIOS\n');
    console.log('=====================================\n');

    // Test workflow
    console.log('1️⃣ WORKFLOW TEST:');
    this.testFullRecruitmentWorkflow();

    // Test validation
    console.log('2️⃣ VALIDATION TEST:');
    const validationTests = this.getValidationTestCases();
    validationTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.testCase}`);
      console.log(`      Data: ${JSON.stringify(test.data)}`);
      console.log(`      Expected Error: ${test.expectedError}\n`);
    });

    // Test permissions
    console.log('3️⃣ PERMISSION TEST:');
    const permissionTests = this.getPermissionTestCases();
    permissionTests.forEach(test => {
      console.log(`   Role: ${test.role}`);
      console.log(`   Allowed: ${test.allowedPages.join(', ')}`);
      console.log(`   Blocked: ${test.blockedPages.join(', ')}\n`);
    });

    // Test username generation
    console.log('4️⃣ USERNAME GENERATION TEST:');
    const usernameTests = this.getUsernameGenerationTestCases();
    usernameTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.description}`);
      console.log(`      Input: "${test.input}"`);
      console.log(`      Expected: "${test.expected}"\n`);
    });

    console.log('=====================================');
    console.log('💡 Để chạy auto-fill form, gõ: startAutoFill()');
    console.log('💡 Để xem chi tiết test, gõ: RecruitmentTestScenarios.testFullRecruitmentWorkflow()');
  }
}

// Export để sử dụng từ console
(window as any).RecruitmentTestScenarios = RecruitmentTestScenarios;

// Tự động chạy khi load trang
if (typeof window !== 'undefined') {
  setTimeout(() => {
    RecruitmentTestScenarios.runConsoleTests();
  }, 1000);
}
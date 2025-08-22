// Dữ liệu mẫu cho việc tự động điền form
export const sampleCandidates = [
  {
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0912345678",
    position_title: "Backend Developer"
  },
  {
    full_name: "Trần Thị Bình",
    email: "tranthibinh@gmail.com", 
    phone: "0987654321",
    position_title: "Frontend Developer"
  },
  {
    full_name: "Lê Hoàng Cường",
    email: "lehoangcuong@gmail.com",
    phone: "0901234567",
    position_title: "HR Generalist"
  },
  {
    full_name: "Phạm Thị Dung",
    email: "phamthidung@gmail.com",
    phone: "0976543210",
    position_title: "Backend Developer"
  },
  {
    full_name: "Hoàng Văn Em",
    email: "hoangvanem@gmail.com",
    phone: "0965432109",
    position_title: "Frontend Developer"
  }
];

// Tạo file CV giả lập
export const createMockCVFile = (candidateName: string): File => {
  const content = `
CV - ${candidateName}

THÔNG TIN CÁ NHÂN:
- Họ và tên: ${candidateName}
- Ngày sinh: 01/01/1990
- Địa chỉ: Hà Nội, Việt Nam

KINH NGHIỆM LÀM VIỆC:
- 2020-2023: Developer tại Công ty ABC
- 2018-2020: Junior Developer tại Công ty XYZ

KỸ NĂNG:
- JavaScript, TypeScript
- React, Node.js
- Database: PostgreSQL, MongoDB

HỌC VẤN:
- 2014-2018: Cử nhân Công nghệ thông tin - Đại học Bách Khoa Hà Nội
`;

  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], `CV_${candidateName.replace(/\s+/g, '_')}.pdf`, {
    type: 'application/pdf'
  });
};

// Hàm delay để mô phỏng thao tác người dùng
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm kiểm tra và chờ element xuất hiện
export const waitForElement = async (selector: string, timeout: number = 10000): Promise<Element | null> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await delay(100);
  }
  
  console.warn(`⚠️ Không tìm thấy element: ${selector} sau ${timeout}ms`);
  return null;
};

// Hàm tự động sửa lỗi validation
export const fixValidationErrors = async (): Promise<boolean> => {
  console.log('🔧 Đang kiểm tra và sửa lỗi validation...');
  
  let hasErrors = false;
  
  // Kiểm tra lỗi email
  const emailError = document.querySelector('input[name="email"] + p.text-red-600');
  if (emailError) {
    console.log('🔧 Sửa lỗi email...');
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (emailInput) {
      const randomNum = Math.floor(Math.random() * 1000);
      emailInput.value = `user${randomNum}@example.com`;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      hasErrors = true;
    }
  }
  
  // Kiểm tra lỗi số điện thoại
  const phoneError = document.querySelector('input[name="phone"] + p.text-red-600');
  if (phoneError) {
    console.log('🔧 Sửa lỗi số điện thoại...');
    const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement;
    if (phoneInput) {
      const randomPhone = '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      phoneInput.value = randomPhone;
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
      hasErrors = true;
    }
  }
  
  // Kiểm tra lỗi họ tên
  const nameError = document.querySelector('input[name="full_name"] + p.text-red-600');
  if (nameError) {
    console.log('🔧 Sửa lỗi họ tên...');
    const nameInput = document.querySelector('input[name="full_name"]') as HTMLInputElement;
    if (nameInput && nameInput.value.length < 2) {
      nameInput.value = 'Nguyễn Văn Test';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      hasErrors = true;
    }
  }
  
  // Kiểm tra lỗi vị trí
  const positionError = document.querySelector('select[name="applied_position_id"] + p.text-red-600');
  if (positionError) {
    console.log('🔧 Sửa lỗi vị trí...');
    const positionSelect = document.querySelector('select[name="applied_position_id"]') as HTMLSelectElement;
    if (positionSelect && positionSelect.options.length > 1) {
      positionSelect.selectedIndex = 1; // Chọn option đầu tiên (không phải "Chọn vị trí")
      positionSelect.dispatchEvent(new Event('change', { bubbles: true }));
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    await delay(1000); // Chờ validation update
  }
  
  return hasErrors;
};

// Hàm tự động điền form với xử lý lỗi
export const autoFillForm = async (candidateData: typeof sampleCandidates[0], positions: any[], retryCount: number = 0): Promise<boolean> => {
  try {
    console.log(`🤖 Đang điền thông tin cho: ${candidateData.full_name} (Lần thử: ${retryCount + 1})`);

    // Chờ form load
    const fullNameInput = await waitForElement('input[name="full_name"]') as HTMLInputElement;
    if (!fullNameInput) {
      throw new Error('Không tìm thấy form');
    }

    // Tìm vị trí phù hợp
    const targetPosition = positions.find(pos => 
      pos.title.toLowerCase().includes(candidateData.position_title.toLowerCase())
    );

    if (!targetPosition) {
      console.warn(`⚠️ Không tìm thấy vị trí: ${candidateData.position_title}, sẽ chọn vị trí đầu tiên`);
    }

    // Lấy các elements
    const emailInput = await waitForElement('input[name="email"]') as HTMLInputElement;
    const phoneInput = await waitForElement('input[name="phone"]') as HTMLInputElement;
    const positionSelect = await waitForElement('select[name="applied_position_id"]') as HTMLSelectElement;
    const fileInput = await waitForElement('input[type="file"]') as HTMLInputElement;

    if (!emailInput || !phoneInput || !positionSelect || !fileInput) {
      throw new Error('Không tìm thấy đầy đủ các trường form');
    }

    // Điền thông tin với animation
    console.log('📝 Điền họ tên...');
    fullNameInput.focus();
    await delay(300);
    fullNameInput.value = '';
    for (let i = 0; i < candidateData.full_name.length; i++) {
      fullNameInput.value += candidateData.full_name[i];
      fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(50);
    }
    fullNameInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(500);

    console.log('📧 Điền email...');
    emailInput.focus();
    await delay(300);
    emailInput.value = '';
    // Thêm timestamp để tránh trùng email
    const uniqueEmail = candidateData.email.replace('@', `${Date.now()}@`);
    for (let i = 0; i < uniqueEmail.length; i++) {
      emailInput.value += uniqueEmail[i];
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(30);
    }
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(500);

    console.log('📱 Điền số điện thoại...');
    phoneInput.focus();
    await delay(300);
    phoneInput.value = '';
    for (let i = 0; i < candidateData.phone.length; i++) {
      phoneInput.value += candidateData.phone[i];
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(50);
    }
    phoneInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(500);

    console.log('💼 Chọn vị trí...');
    positionSelect.focus();
    await delay(300);
    if (targetPosition) {
      positionSelect.value = targetPosition.id;
    } else if (positionSelect.options.length > 1) {
      positionSelect.selectedIndex = 1; // Chọn option đầu tiên
    }
    positionSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(500);

    console.log('📄 Upload CV...');
    const cvFile = createMockCVFile(candidateData.full_name);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(cvFile);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(1000);

    // Kiểm tra và sửa lỗi validation
    const hasErrors = await fixValidationErrors();
    if (hasErrors) {
      console.log('🔧 Đã sửa một số lỗi validation');
      await delay(1000);
    }

    console.log(`✅ Đã điền xong thông tin cho: ${candidateData.full_name}`);
    return true;

  } catch (error) {
    console.error(`❌ Lỗi khi điền form cho ${candidateData.full_name}:`, error);
    
    // Retry logic
    if (retryCount < 2) {
      console.log(`🔄 Thử lại lần ${retryCount + 2}...`);
      await delay(2000);
      return autoFillForm(candidateData, positions, retryCount + 1);
    }
    
    return false;
  }
};

// Hàm tự động submit với xử lý lỗi
export const autoSubmitForm = async (retryCount: number = 0): Promise<boolean> => {
  try {
    console.log('🚀 Đang submit form...');
    
    const submitButton = await waitForElement('button[type="submit"]') as HTMLButtonElement;
    
    if (!submitButton) {
      throw new Error('Không tìm thấy nút submit');
    }

    if (submitButton.disabled) {
      console.warn('⚠️ Nút submit đang bị vô hiệu hóa, kiểm tra lỗi...');
      
      // Thử sửa lỗi validation
      const hasErrors = await fixValidationErrors();
      if (hasErrors) {
        await delay(1000);
        // Thử lại sau khi sửa lỗi
        if (retryCount < 2) {
          return autoSubmitForm(retryCount + 1);
        }
      }
      
      if (submitButton.disabled) {
        throw new Error('Nút submit vẫn bị vô hiệu hóa sau khi sửa lỗi');
      }
    }

    // Click submit
    submitButton.click();
    
    // Chờ và kiểm tra kết quả
    await delay(3000);
    
    // Kiểm tra toast thành công
    const successToast = document.querySelector('.Toaster__toast--success, [data-sonner-toast][data-type="success"]');
    if (successToast) {
      console.log('✅ Submit thành công!');
      return true;
    }
    
    // Kiểm tra toast lỗi
    const errorToast = document.querySelector('.Toaster__toast--error, [data-sonner-toast][data-type="error"]');
    if (errorToast) {
      const errorMessage = errorToast.textContent || 'Lỗi không xác định';
      console.error('❌ Submit thất bại:', errorMessage);
      
      // Xử lý lỗi cụ thể
      if (errorMessage.includes('trùng') || errorMessage.includes('duplicate')) {
        console.log('🔧 Lỗi trùng dữ liệu, sẽ thử với email khác...');
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        if (emailInput) {
          const randomNum = Math.floor(Math.random() * 10000);
          emailInput.value = `user${randomNum}${Date.now()}@example.com`;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          await delay(1000);
          
          if (retryCount < 2) {
            return autoSubmitForm(retryCount + 1);
          }
        }
      }
      
      return false;
    }
    
    // Nếu không có toast nào, coi như thành công
    console.log('✅ Submit hoàn tất (không có thông báo lỗi)');
    return true;
    
  } catch (error) {
    console.error('❌ Lỗi khi submit form:', error);
    
    if (retryCount < 2) {
      console.log(`🔄 Thử submit lại lần ${retryCount + 2}...`);
      await delay(2000);
      return autoSubmitForm(retryCount + 1);
    }
    
    return false;
  }
};

// Hàm chạy toàn bộ quy trình tự động với xử lý lỗi
export const runAutoFormFiller = async (positions: any[], candidateIndex: number = 0): Promise<void> => {
  if (candidateIndex >= sampleCandidates.length) {
    console.log('🎉 Đã hoàn thành tất cả ứng viên mẫu!');
    console.log('📊 Thống kê:');
    console.log(`   - Tổng số ứng viên: ${sampleCandidates.length}`);
    console.log(`   - Đã xử lý: ${candidateIndex}`);
    return;
  }

  const candidate = sampleCandidates[candidateIndex];
  console.log(`\n📝 Bắt đầu xử lý ứng viên ${candidateIndex + 1}/${sampleCandidates.length}: ${candidate.full_name}`);
  console.log('=' .repeat(60));

  try {
    // Điền form
    const fillSuccess = await autoFillForm(candidate, positions);
    
    if (!fillSuccess) {
      console.error(`❌ Không thể điền form cho: ${candidate.full_name}`);
      console.log('⏭️ Chuyển sang ứng viên tiếp theo...');
      await delay(2000);
      return runAutoFormFiller(positions, candidateIndex + 1);
    }

    // Submit form
    const submitSuccess = await autoSubmitForm();
    
    if (submitSuccess) {
      console.log(`✅ Đã xử lý thành công: ${candidate.full_name}`);
      
      // Chờ một chút trước khi xử lý ứng viên tiếp theo
      console.log('⏳ Chờ 3 giây trước khi tiếp tục...');
      await delay(3000);
      
      // Reload trang để reset form
      console.log('🔄 Reload trang để reset form...');
      window.location.reload();
      
      // Sau khi reload, tiếp tục với ứng viên tiếp theo
      setTimeout(() => {
        runAutoFormFiller(positions, candidateIndex + 1);
      }, 3000);
    } else {
      console.error(`❌ Không thể submit form cho: ${candidate.full_name}`);
      console.log('⏭️ Chuyển sang ứng viên tiếp theo...');
      await delay(2000);
      return runAutoFormFiller(positions, candidateIndex + 1);
    }
    
  } catch (error) {
    console.error(`💥 Lỗi nghiêm trọng khi xử lý ${candidate.full_name}:`, error);
    console.log('⏭️ Chuyển sang ứng viên tiếp theo...');
    await delay(2000);
    return runAutoFormFiller(positions, candidateIndex + 1);
  }
};

// Hàm dừng auto fill
export const stopAutoFill = () => {
  console.log('🛑 Đã dừng auto fill');
  // Clear tất cả timeout
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }
};

// Hàm kiểm tra trạng thái form
export const checkFormStatus = () => {
  console.log('🔍 KIỂM TRA TRẠNG THÁI FORM:');
  console.log('=' .repeat(40));
  
  const fullNameInput = document.querySelector('input[name="full_name"]') as HTMLInputElement;
  const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
  const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement;
  const positionSelect = document.querySelector('select[name="applied_position_id"]') as HTMLSelectElement;
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
  
  console.log('📋 Các trường form:');
  console.log(`   - Họ tên: ${fullNameInput ? '✅' : '❌'} (${fullNameInput?.value || 'trống'})`);
  console.log(`   - Email: ${emailInput ? '✅' : '❌'} (${emailInput?.value || 'trống'})`);
  console.log(`   - SĐT: ${phoneInput ? '✅' : '❌'} (${phoneInput?.value || 'trống'})`);
  console.log(`   - Vị trí: ${positionSelect ? '✅' : '❌'} (${positionSelect?.selectedOptions[0]?.text || 'chưa chọn'})`);
  console.log(`   - CV: ${fileInput ? '✅' : '❌'} (${fileInput?.files?.length ? fileInput.files[0].name : 'chưa chọn'})`);
  console.log(`   - Nút submit: ${submitButton ? '✅' : '❌'} (${submitButton?.disabled ? 'vô hiệu hóa' : 'có thể click'})`);
  
  // Kiểm tra lỗi validation
  const errors = document.querySelectorAll('p.text-red-600');
  if (errors.length > 0) {
    console.log('❌ Lỗi validation:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.textContent}`);
    });
  } else {
    console.log('✅ Không có lỗi validation');
  }
};

// Export các hàm để sử dụng từ console
(window as any).autoFormFiller = {
  sampleCandidates,
  autoFillForm,
  autoSubmitForm,
  runAutoFormFiller,
  stopAutoFill,
  checkFormStatus,
  createMockCVFile,
  fixValidationErrors
};

console.log('🤖 AUTO FORM FILLER LOADED!');
console.log('📖 Hướng dẫn sử dụng:');
console.log('   - startAutoFill(): Bắt đầu tự động điền form');
console.log('   - autoFormFiller.stopAutoFill(): Dừng auto fill');
console.log('   - autoFormFiller.checkFormStatus(): Kiểm tra trạng thái form');
console.log('   - autoFormFiller.fixValidationErrors(): Tự động sửa lỗi validation');
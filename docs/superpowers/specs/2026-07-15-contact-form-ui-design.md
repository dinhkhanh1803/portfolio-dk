# Contact Form UI Design

## Mục tiêu

Refactor phần liên hệ hiện tại thành bố cục hai cột: bốn thẻ thông tin liên hệ ở bên trái và form yêu cầu dự án ở bên phải. Giai đoạn này chỉ triển khai giao diện; chưa kết nối API gửi email và chưa mô phỏng trạng thái gửi thành công.

## Bố cục

- Giữ nguyên khung `contact-card`, nền kính mờ, góc bo lớn và hai mảng trang trí xanh/cam.
- Bỏ toàn bộ headline, nhãn “Bắt đầu một dự án” và đoạn giới thiệu.
- Cột trái giữ bốn mục: email, điện thoại/Zalo, Facebook và địa điểm. Email, điện thoại và Facebook vẫn là liên kết; địa điểm là nội dung tĩnh.
- Cột phải là một panel form riêng, nền trắng mờ và cùng ngôn ngữ thiết kế với các thẻ liên hệ.
- Desktop dùng hai cột; tablet/mobile xếp thông tin liên hệ phía trên, form phía dưới.

## Nội dung form

Form gồm sáu trường:

1. Họ và tên.
2. Email.
3. Điện thoại/Zalo.
4. Loại dự án.
5. Ngân sách dự kiến.
6. Nội dung cần trao đổi.

Các nhãn, placeholder và tùy chọn hỗ trợ cả tiếng Việt lẫn tiếng Anh theo nút chuyển ngôn ngữ hiện có.

## Kiến trúc component

- Tách phần liên hệ ra `app/contact-section.tsx` để tránh tiếp tục làm lớn `app/page.tsx` và tạo ranh giới rõ ràng cho lần nối API sau.
- Component nhận ngôn ngữ hiện tại qua prop và tự chọn nội dung VI/EN của riêng phần liên hệ.
- `app/page.tsx` chỉ render `<ContactSection language={language} />` tại vị trí section hiện tại.
- CSS tiếp tục nằm trong `app/globals.css` để đi theo tổ chức hiện có; chỉ thay các selector của phần contact cần thiết.

## Hành vi giai đoạn UI

- Dùng phần tử `form` và các control có nhãn để đảm bảo cấu trúc truy cập được.
- Nút “Gửi yêu cầu” có `type="button"`, không submit, không reload trang và không hiển thị thông báo giả.
- Không thêm API route, thư viện email, biến môi trường, validation runtime hoặc state gửi.

## Kiểm thử và xác minh

- Thêm contract test tối thiểu để khóa sáu trường, bốn thông tin liên hệ và hành vi nút chưa submit.
- Chạy test theo chu trình đỏ-xanh, sau đó chạy ESLint và Next.js production build.
- Kiểm tra trực quan trên desktop và mobile để xác nhận thứ tự hai cột, khả năng co giãn và sự nhất quán với giao diện hiện tại.

## Ngoài phạm vi

- Gửi email, API route, Resend/SendGrid/SMTP.
- Chống spam, rate limit, CAPTCHA.
- Validation và trạng thái loading/success/error.

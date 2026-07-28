# Thiết kế trang Liên hệ với CV thu nhỏ

## Mục tiêu

Xây dựng lại route `/contact` thành một trang hồ sơ và liên hệ hoàn chỉnh. Nửa trên trình bày CV thu nhỏ theo hướng TopCV hiện đại; nửa dưới gồm các card thông tin liên hệ và form yêu cầu dự án. Trang phải đồng bộ với hệ hình ảnh kem, teal, coral, glass-panel và chế độ sáng/tối hiện có.

## Phạm vi

- Thay toàn bộ nội dung hiện tại của `app/contact/page.tsx`.
- Bổ sung style riêng cho contact trong `app/globals.css`, giới hạn selector dưới `.contact-page`.
- Giữ nguyên header, footer, language provider và dữ liệu portfolio dùng chung.
- Hỗ trợ tiếng Việt và tiếng Anh.
- Form chỉ là giao diện; không gửi dữ liệu và không mô phỏng trạng thái thành công.
- Avatar, kinh nghiệm và học vấn dùng nội dung mockup có cấu trúc rõ ràng để thay dữ liệu thật sau.

## Hướng hình ảnh

Sử dụng bố cục TopCV hiện đại đã được chọn, nhưng điều chỉnh theo ngôn ngữ portfolio hiện tại:

- Nền kem có ambient gradient nhẹ.
- Khối CV và form dùng kính mờ, viền sáng, bóng đổ mềm và góc bo lớn.
- Teal là màu chính cho nhãn, icon và timeline; coral dùng cho CTA và điểm nhấn.
- Typography rõ ràng, ưu tiên khả năng quét nhanh hơn trang trí.
- Avatar tạm thời là monogram `DK`, được đóng gói trong một vùng có thể thay bằng ảnh thật mà không đổi bố cục.

## Cấu trúc trang

### CV thu nhỏ

Khối CV ở đầu trang gồm:

1. Header hồ sơ:
   - Avatar `DK`.
   - Tên Trần Đình Khánh.
   - Chức danh Full-stack Developer.
   - Địa điểm Đà Nẵng, Việt Nam.
   - Trạng thái sẵn sàng trao đổi cơ hội phù hợp.
   - CTA tải CV dạng liên kết placeholder và CTA cuộn đến form liên hệ.

2. Cột trái:
   - Giới thiệu ngắn lấy từ `portfolio[language].profile.summary`.
   - Danh sách kỹ năng cô đọng lấy từ dữ liệu portfolio hiện có.
   - Thông tin liên hệ nhanh.

3. Cột phải:
   - Timeline kinh nghiệm với nội dung mockup song ngữ.
   - Timeline học vấn với nội dung mockup song ngữ.
   - Các mốc phải được định nghĩa tập trung trong file trang để dễ thay thế, không rải trực tiếp trong JSX.

### Khu vực liên hệ

Phần dưới có tiêu đề mời hợp tác và bố cục hai cột:

- Cột thông tin gồm bốn card: Email, Điện thoại/Zalo, Facebook và Địa điểm.
- Email, điện thoại và Facebook là liên kết; địa điểm là nội dung tĩnh.
- Cột form nằm trong panel riêng, gồm sáu trường:
  1. Họ và tên.
  2. Email.
  3. Điện thoại/Zalo.
  4. Loại dự án.
  5. Ngân sách dự kiến.
  6. Nội dung cần trao đổi.
- Nút hành động dùng `type="button"` để không submit hoặc reload khi chưa có API.

## Component và dữ liệu

`app/contact/page.tsx` tiếp tục là client component vì cần đọc ngôn ngữ hiện tại. Dữ liệu nội dung riêng của trang được gom trong một object VI/EN gần đầu file. Các mảng kinh nghiệm, học vấn, lựa chọn dự án và ngân sách được render bằng `map` để dễ thay đổi.

Chưa tách component con sang file mới vì trang chỉ có một người dùng và chưa có logic gửi form. Các khối semantic như `section`, `article`, `form`, `label`, `input`, `select` và `textarea` vẫn tạo ranh giới rõ ràng. Nếu form được nối API sau này, form sẽ được tách thành client component riêng.

## Tương tác và khả năng truy cập

- CTA liên hệ trong CV trỏ đến `#contact-form`.
- Liên kết tải CV dùng trạng thái placeholder rõ ràng và không trỏ tới tệp không tồn tại; trong bản UI đầu tiên, CTA này hiển thị nhưng ở trạng thái chưa khả dụng với nhãn song ngữ phù hợp.
- Mọi control có `label` liên kết bằng `htmlFor`.
- Các icon trang trí có `aria-hidden`.
- Trạng thái focus dùng outline hiện có; hover chỉ bổ sung chuyển động nhỏ.
- Tuân thủ `prefers-reduced-motion`.
- Nội dung và viền có độ tương phản phù hợp ở cả light và dark theme.

## Responsive

- Desktop: CV hai cột; khu liên hệ chia card thông tin và form.
- Tablet: CV vẫn hai cột với tỷ lệ hẹp hơn; khu liên hệ có thể chuyển một cột.
- Mobile: mọi phần xếp dọc theo thứ tự hồ sơ, kinh nghiệm, học vấn, card liên hệ, form. CTA và control chiếm đủ chiều rộng khi cần.
- Không khóa chiều cao viewport; trang cuộn tự nhiên.

## Kiểm thử

- Thêm contract test riêng cho trang contact để khóa:
  - Khối CV, timeline kinh nghiệm và học vấn.
  - Avatar placeholder `DK`.
  - Bốn kênh liên hệ.
  - Sáu trường form.
  - Nút form là `type="button"`.
  - Nội dung song ngữ và selector CSS chính.
- Thực hiện theo chu trình test đỏ rồi mới sửa implementation.
- Chạy contract test contact, toàn bộ test liên quan, ESLint và production build.
- Kiểm tra trực quan ở desktop và mobile, light và dark theme.

## Ngoài phạm vi

- API gửi email, SMTP, Resend hoặc dịch vụ form bên thứ ba.
- Validation runtime, loading, success, error, rate limit hoặc CAPTCHA.
- Tệp CV thật và ảnh chân dung thật.
- Thay đổi dữ liệu portfolio toàn cục hoặc thiết kế các route khác.

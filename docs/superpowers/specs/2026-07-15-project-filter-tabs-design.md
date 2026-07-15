# Project Filter Tabs Design

## Mục tiêu

Thêm bộ lọc dạng tab cho phần dự án để người xem chuyển nhanh giữa toàn bộ dự án, Web, Mobile và Game mà không tải lại trang.

## Giao diện

- Hàng tab nằm giữa tiêu đề phần dự án và lưới card.
- Bốn tab tiếng Việt: `Tất cả`, `Web`, `Mobile`, `Game`.
- Bốn tab tiếng Anh: `All`, `Web`, `Mobile`, `Game`.
- Tab đang chọn dùng nền teal, chữ trắng và shadow nhẹ; tab còn lại dùng bề mặt glass, viền mảnh và trạng thái hover/focus rõ ràng.
- Trên màn hình nhỏ, hàng tab giữ một dòng và có thể cuộn ngang thay vì xuống dòng lộn xộn.

## Phân loại dữ liệu

- `Heritage Ginseng`: Web.
- `Electronics Commerce`: Web.
- `Ocean Quest`: Game.
- `Booking Platform`: Mobile.

Mỗi dự án có khóa lọc ổn định độc lập với nhãn `category` đang hiển thị. Chỉ số visual gốc cũng được giữ lại để icon, màu nền và class `project-1` đến `project-4` không thay đổi sau khi lọc.

## Tương tác và truy cập

- Bộ lọc dùng React state trong trang hiện tại; mặc định là `all`.
- Nhấn tab cập nhật danh sách ngay trên client, không thay URL và không reload.
- Mỗi nút có `type="button"`, `aria-pressed` và focus-visible style.
- Đổi ngôn ngữ chỉ đổi nhãn tab; bộ lọc đang chọn được giữ nguyên.

## Kiểm thử

- Contract test khóa bốn filter key, nhãn VI/EN, trạng thái mặc định và thuộc tính `aria-pressed`.
- Chạy test, ESLint và production build.
- Xác minh dev server trả về markup tab và CSS tương ứng.

## Ngoài phạm vi

- Đồng bộ filter với query string.
- Animation phức tạp hoặc thư viện chuyển cảnh.
- Phân trang, tìm kiếm và tải dự án từ API.

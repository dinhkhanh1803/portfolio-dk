# Neon Keys Song Selection

## Mục tiêu

Thêm chế độ chơi theo bài hát vào Neon Keys để người chơi chọn một bản nhạc, xem độ khó/BPM/thời lượng và đánh đúng chart nốt cố định. Chế độ Piano tự do hiện tại được giữ nguyên.

## Danh sách bài

Phiên bản đầu gồm sáu giai điệu public-domain, được phối thành chart một quãng tám phù hợp với 12 phím hiện tại:

1. Ode to Joy — Easy — 96 BPM
2. Twinkle Twinkle Little Star — Easy — 90 BPM
3. Happy Birthday — Normal — 108 BPM
4. Jingle Bells — Normal — 120 BPM
5. Für Elise — Hard — 132 BPM
6. Turkish March — Hard — 144 BPM

Mỗi bài lưu `id`, tên, tác giả/nguồn, độ khó, BPM và danh sách sự kiện `{ beat, key }`. Thời lượng được tính từ chart thay vì nhập thủ công.

## Luồng giao diện

- Chế độ Challenge hiển thị thanh chọn bài phía trên sân khấu.
- Mỗi card bài hát hiển thị tên, độ khó, BPM và thời lượng.
- Chọn bài khi đang chơi sẽ tạo lượt chơi mới ở trạng thái `ready`.
- Nút nghe thử phát đoạn mở đầu ngắn bằng Web Audio, không tự bắt đầu game.
- Khi bắt đầu, engine phát nốt rơi đúng thời điểm theo chart đã chọn.
- Kết thúc khi chart chạy hết và không còn nốt trên sân khấu; mất hết năm mạng vẫn kết thúc sớm.
- Piano tự do ẩn bộ chọn bài và không thay đổi cơ chế đánh phím.

## Engine và dữ liệu

- Tách catalog bài hát sang `neon-keys-songs.ts`.
- `createPianoRun(songId)` khởi tạo thời lượng và chỉ số chart cho bài được chọn.
- `tickPianoRun` sinh nốt từ các sự kiện chart đã đến thời điểm, không dùng random spawn.
- Một bài phải có ít nhất một nốt, chỉ số phím trong `0..11`, beat tăng dần và BPM hợp lệ.
- Hệ thống chấm Perfect/Good/Miss, combo, điểm, pause và local best hiện tại được giữ nguyên.
- Kỷ lục được lưu riêng theo từng bài.

## Trạng thái lỗi

- `songId` không tồn tại sẽ dùng Ode to Joy.
- Dữ liệu chart không hợp lệ bị phát hiện bởi test; runtime không nhận dữ liệu từ người dùng.
- Web Audio không khả dụng thì game vẫn chơi được, chỉ không phát âm thanh.

## Kiểm thử

- Catalog có đúng sáu bài và toàn bộ chart hợp lệ.
- Hai bài khác nhau sinh chuỗi nốt khác nhau.
- Nốt xuất hiện đúng theo beat/BPM.
- Lượt chơi hoàn thành sau nốt cuối.
- Đổi bài reset điểm, combo, mạng và phase.
- UI có sáu lựa chọn, thông tin bài, preview và vẫn giữ Free Play/theme.
- Chạy engine tests, UI contract tests, ESLint, TypeScript và production build.

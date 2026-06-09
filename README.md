<div align="center">
  <h2>TradingAgents-Vn: Nền Tảng Phân Tích & Giao Dịch Đa Tác nhân (Multi-Agent)</h2>
  <p><i>Được thiết kế chuyên biệt cho thị trường tài chính Việt Nam</i></p>
</div>

> **TradingAgents-Vn** là phiên bản mở rộng đột phá từ nền tảng TradingAgents nguyên bản. Ứng dụng sức mạnh của kiến trúc Đa Tác nhân AI (Multi-Agent System), hệ thống mô phỏng chính xác quy trình vận hành của một Quỹ Đầu Tư chuyên nghiệp (Hedge Fund) ngay trên trình duyệt của bạn. Bằng việc giải quyết triệt để bài toán dữ liệu nội địa, nền tảng cung cấp một quy trình phân tích và ra quyết định liền mạch, tự động và khách quan.

<br>

### Tại Sao Nên Chọn TradingAgents-Vn?

#### Kiến Trúc Vững Chắc & Hiệu Suất Cao
- **Xử Lý Luồng Phức Tạp:** Sử dụng **LangGraph** điều phối mượt mà nhiều Tác nhân đồng thời.
- **Real-time (Thời Gian Thực):** Kiến trúc `asyncio` đẩy trực tiếp suy luận của AI lên UI không độ trễ.
- **Tối Ưu Tài Nguyên:** Phân loại thông minh giữa truy vấn nhanh (định giá, biểu đồ) và phân tích sâu.

#### Chống "Ảo Giác" AI & Chuẩn Mực Quỹ Đầu Tư
- **Cơ Chế Tranh Biện (Debate):** Mô hình đối kháng `Bull` vs `Bear` triệt tiêu ảo giác LLM và thiên kiến xác nhận.
- **Đầu Ra Chính Xác:** Chuẩn hóa dữ liệu bằng Pydantic đảm bảo logic và định dạng báo cáo.
- **Chuẩn Quỹ Đầu Tư:** Phân tích độc lập $\rightarrow$ Tranh biện $\rightarrow$ Quản trị rủi ro $\rightarrow$ Duyệt $\rightarrow$ Thực thi.
- **Giao Dịch Thực Chiến:** Đưa ra rõ Target Price, Stop Loss, Risk/Reward và dự phóng 5 ngày.

#### Khác Biệt Cốt Lõi: Công Cụ Nội Địa & Dữ Liệu "Sống"
Khác với bản gốc dùng API chung, **TradingAgents-Vn** tích hợp Browser Agent (Playwright) giải quyết bài toán dữ liệu "đóng" tại Việt Nam:
- **Dữ Liệu Độc Quyền:** Tự động trích xuất vĩ mô, quỹ ETF, sở hữu khối ngoại, và tâm lý từ CafeF, FireAnt, HOSE/HNX.
- **Độ Tin Cậy Tuyệt Đối:** Không dùng mock data. AI ra quyết định dựa trên thông số thực tế theo thời gian thực.
- **Công Cụ Nhanh:** Cung cấp bộ lọc cổ phiếu, định giá P/E, và nhận diện mẫu hình nến tức thời.

---

### Kiến Trúc Đội Ngũ AI (AI Agent Architecture)

Hệ thống phân rã quy trình phân tích thành các vai trò chuyên biệt để tối đa hóa tính đa chiều:

- **1. Phân Tích (Analyst):** Đánh giá Cơ bản (tài chính), Kỹ thuật (biểu đồ), Tâm lý (mạng xã hội), và Tin tức (vĩ mô).
- **2. Nghiên Cứu (Research):** Phe Tích cực (Bull) và Tiêu cực (Bear) tranh biện để tìm ra rủi ro tiềm ẩn.
- **3. Thực Thi (Execution):** Quản lý chốt báo cáo -> Giám đốc duyệt rủi ro -> Trader lên kế hoạch chi tiết.

---

### Giao Diện Trực Quan & Tương Tác

Nền tảng cung cấp một giao diện người dùng chuyên nghiệp, cho phép giám sát luồng công việc của các Tác nhân và tương tác dữ liệu theo thời gian thực.

<p align="center">
  <img src="assets/vn/chat.png" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</p>
<p align="center"><i>Giao diện hội thoại thông minh tự động kết xuất biểu đồ kỹ thuật và dòng tiền.</i></p>

<p align="center">
  <img src="assets/vn/analyst.png" width="100%" style="display: inline-block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 2%;">
</p>

<p align="center">
  <img src="assets/vn/scrap.png" width="100%" style="display: inline-block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 2%;">
</p>
<p align="center"><i>Giám sát luồng thu thập dữ liệu (scraping) thị trường trực tiếp.</i></p>

<p align="center">
  <img src="assets/vn/reports.png" width="100%" style="display: inline-block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 2%;">
</p>
<p align="center"><i>Báo cáo đầu ra có cấu trúc chặt chẽ với khuyến nghị, mức độ tự tin và dự phóng 5 ngày.</i></p>

---

### Hướng Dẫn Cài Đặt & Khởi Chạy

#### Yêu cầu hệ thống
- **Môi trường:** Linux/macOS hoặc WSL (Windows)
- **Node.js:** `>= 20.9.0` (Khuyến nghị dùng `nvm`)
- **Python:** `>= 3.10`
- **Docker:** Docker & Docker Compose (cho môi trường Production)

#### 1. Triển khai bằng Docker (Production)
Cách nhanh nhất và ổn định nhất để chạy ứng dụng.

```bash
# Xây dựng và khởi động toàn bộ hệ thống
docker compose up -d --build

# Kiểm tra trạng thái các containers
docker compose ps
```
> **Lưu ý:** UI sẽ chạy tại `http://localhost:3000` và Backend API tại `http://localhost:8000`. 
> Tài khoản Admin mặc định được thiết lập qua biến môi trường `DEFAULT_ADMIN_EMAIL` và `DEFAULT_ADMIN_PASSWORD` (Mặc định: `admin@tradingagents.com` / `admin123`).
> Bạn có thể thay đổi bằng cách tạo file `.env` từ `.env.example` trước khi build.

#### 2. Triển khai Local (Development)

##### Bước 2.1: Khởi chạy Backend
```bash
# Di chuyển vào thư mục dự án
cd TradingAgents-Vn

# (Tuỳ chọn) Tạo môi trường ảo
python3 -m venv .venv
source .venv/bin/activate

# Cài đặt framework cốt lõi
pip install -e .

# Cài đặt backend
pip install -e ./trading-be

# Cài đặt Playwright (bắt buộc để thu thập dữ liệu web)
playwright install chromium --with-deps

# Khởi chạy Backend
cd trading-be

# (Quan trọng) Copy file template và cấu hình env nếu cần đổi Admin mặc định
cp .env.example .env

alembic upgrade head           # Chạy database migrations
python scripts/seed_admin.py   # Tạo tài khoản admin mặc định dựa trên .env
fastapi dev main.py --host 0.0.0.0 --port 8000
```

##### Bước 2.2: Khởi chạy Frontend (UI)
Mở một terminal mới:
```bash
# Di chuyển vào thư mục UI
cd TradingAgents-Vn/trading-ui

# Cài đặt dependencies và chạy UI
npm install
npm run dev
```

---

<div align="left">
  <p><i><b>Tuyên Bố Miễn Trừ Trách Nhiệm:</b> TradingAgents-Vn được thiết kế nghiêm ngặt cho mục đích nghiên cứu, giáo dục và thử nghiệm thuật toán AI. Hệ thống không cung cấp lời khuyên tài chính hay khuyến nghị đầu tư chính thức. Người dùng tự chịu trách nhiệm cho các quyết định đầu tư thực tế.</i></p>
</div>

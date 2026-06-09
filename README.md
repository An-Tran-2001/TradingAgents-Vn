<div align="center">
  <h1>TradingAgents-Vn: Nền Tảng Phân Tích & Giao Dịch Đa Đặc Vụ (Multi-Agent)</h1>
  <p><i>Được thiết kế chuyên biệt cho thị trường tài chính Việt Nam</i></p>
</div>

> **TradingAgents-Vn** là phiên bản mở rộng đột phá từ nền tảng TradingAgents nguyên bản. Ứng dụng sức mạnh của kiến trúc Đa Đặc Vụ AI (Multi-Agent System), hệ thống mô phỏng chính xác quy trình vận hành của một Quỹ Đầu Tư chuyên nghiệp (Hedge Fund) ngay trên trình duyệt của bạn. Bằng việc giải quyết triệt để bài toán dữ liệu nội địa, nền tảng cung cấp một quy trình phân tích và ra quyết định liền mạch, tự động và khách quan.

<br>

## Tại Sao Nên Chọn TradingAgents-Vn?

Hệ thống được kiến trúc dựa trên các tiêu chuẩn khắt khe nhất về công nghệ và nghiệp vụ tài chính, mang lại sự tin cậy tuyệt đối:

### Kiến Trúc Vững Chắc & Hiệu Suất Cao
- **Xử Lý Luồng Cấp Doanh Nghiệp:** Ứng dụng **LangGraph** làm lõi điều phối, nền tảng dễ dàng giải quyết các workflow phân nhánh phức tạp (nhiều Agent phân tích đồng thời) và hội tụ quyết định một cách mượt mà.
- **Trải Nghiệm Thời Gian Thực:** Kiến trúc hướng sự kiện với cơ chế bất đồng bộ (`asyncio`) cho phép đẩy trực tiếp quá trình suy luận của AI lên giao diện. Bạn có thể theo dõi sát sao "dòng suy nghĩ" của từng Đặc vụ mà không gặp hiện tượng độ trễ.
- **Tối Ưu Tài Nguyên Thông Minh:** Hệ thống tự động phân loại tác vụ. Các truy vấn nhanh (định giá nhanh, biểu đồ) được xử lý ngay lập tức, trong khi các báo cáo chuyên sâu mới kích hoạt toàn bộ Đội ngũ Nghiên cứu.

### Tư Duy Đa Chiều & Chống "Ảo Giác" AI (Anti-Hallucination)
- **Cơ Chế Tranh Biện (Debate Mechanism):** Đây là "vũ khí" cốt lõi. Bằng cách tạo ra mô hình đối kháng giữa `Bull Researcher` (Lạc quan) và `Bear Researcher` (Bi quan), hệ thống tự động triệt tiêu các "ảo giác" thường thấy ở AI và loại bỏ hoàn toàn thiên kiến xác nhận.
- **Kiểm Soát Độ Chính Xác Tuyệt Đối:** Đầu ra được định hình bằng cấu trúc dữ liệu nghiêm ngặt (Pydantic & Structured Outputs), đảm bảo mọi con số và báo cáo tài chính luôn chuẩn xác về mặt logic trước khi trình bày.

### Khác Biệt Cốt Lõi: Bộ Công Cụ Nội Địa & Độ Tin Cậy Dữ Liệu
Khác với bản TradingAgents nguyên bản (vốn sử dụng các API tiêu chuẩn như Alpha Vantage cho thị trường Mỹ/Toàn cầu), phiên bản **TradingAgents-Vn** được trang bị một hệ sinh thái **Công cụ Nội địa (Vietnam Tools)** chạy trên nền tảng Browser Agent (Playwright) hoàn toàn tự động, giải quyết triệt để bài toán "khát" dữ liệu API mở tại Việt Nam:

- **Nâng Cấp Dữ Liệu Độc Quyền:** 
  - **Vĩ mô & Dòng tiền:** Tự động trích xuất chỉ số CPI, GDP, tỷ giá (`get_vietnam_macro`) và theo dõi sát sao dòng tiền từ các quỹ lớn như Fubon, Diamond ETF (`get_vn_etf_flow`).
  - **Dữ liệu Doanh nghiệp:** Bóc tách trực tiếp tỷ lệ sở hữu khối ngoại, động thái của các tay to (Dragon Capital, VinaCapital) và các thông báo minh bạch từ Sở Giao dịch HOSE/HNX (`get_vn_major_shareholders`, `get_vn_official_announcements`).
  - **Tâm lý Bầy đàn (Retail Sentiment):** Quét tin tức và đo lường tâm lý nhà đầu tư từ các cộng đồng rôm rả nhất như FireAnt, CafeF, và diễn đàn chứng khoán (`get_vn_social_sentiment`, `get_vn_market_news`).
- **Độ Tin Cậy Tuyệt Đối (Data Reliability):** Thay vì phụ thuộc vào dữ liệu giả lập (mock data) hay các API miễn phí chậm trễ, Agent tự động điều khiển trình duyệt truy cập, "đọc" và trích xuất trực tiếp báo cáo từ các nguồn tài chính uy tín nhất Việt Nam theo thời gian thực. Mọi quyết định của LLM đều được "neo" (grounded) trên dữ liệu "sống" 100%.
- **Công Cụ Phân Tích Nhanh (Quick Insights):** Bổ sung loạt công cụ định lượng chuyên sâu cho thị trường Việt Nam như: lọc cổ phiếu theo bộ tiêu chí (`screen_stocks`), định giá nhanh P/E P/B so với ngành (`get_quick_valuation`), và nhận diện ngay lập tức mẫu hình nến kỹ thuật đảo chiều (`detect_candlestick_pattern`).

### Chuẩn Mực Quỹ Đầu Tư (Institutional Workflow)
- **Quy Trình Vận Hành Chuyên Nghiệp:** Nền tảng tuân thủ quy trình đầu tư khắt khe: *Phân tích độc lập $\rightarrow$ Tranh biện phản biện $\rightarrow$ Quản trị rủi ro $\rightarrow$ Giám đốc danh mục chốt quyền $\rightarrow$ Trader lên kế hoạch thực thi*.
- **Hành Động Thực Chiến (Actionable Insights):** Cung cấp các thông số định lượng rõ ràng để giao dịch thực tế: Điểm vào lệnh, Giá mục tiêu, Điểm cắt lỗ, Tỷ lệ Rủi ro/Lợi nhuận, cùng dự phóng xu hướng chi tiết cho 5 ngày tiếp theo.

---

## Kiến Trúc Đội Ngũ AI (AI Agent Architecture)

Hệ thống phân rã quy trình phân tích tài chính phức tạp thành các vai trò chuyên biệt nhằm giảm thiểu sai lệch và tối đa hóa tính đa chiều.

### 1. Đội Ngũ Phân Tích (Analyst Team)
- **Phân Tích Cơ Bản (Fundamentals):** Đánh giá báo cáo tài chính, cơ cấu cổ đông và định giá cốt lõi.
- **Phân Tích Kỹ Thuật (Technical):** Diễn giải biểu đồ, chỉ báo kỹ thuật và độ rộng thị trường.
- **Phân Tích Tâm Lý (Sentiment):** Tổng hợp tâm lý đám đông từ các diễn đàn và mạng xã hội trong nước.
- **Phân Tích Tin Tức (News):** Giám sát sự kiện kinh tế vĩ mô và thông báo từ tổ chức phát hành.

### 2. Đội Ngũ Nghiên Cứu (Research Team)
Bao gồm các nhà nghiên cứu mang quan điểm **Tích cực (Bullish)** và **Tiêu cực (Bearish)**. Họ thực hiện các phiên tranh luận có cấu trúc nhằm đào sâu và phản biện các báo cáo từ Đội ngũ Phân tích, phơi bày mọi rủi ro tiềm ẩn.

### 3. Đội Ngũ Thực Thi (Execution Team)
- **Quản Lý Nghiên Cứu (Research Manager):** Tổng hợp kết quả tranh luận thành đánh giá toàn diện.
- **Giám Đốc Danh Mục (Portfolio Manager):** Đánh giá rủi ro hệ thống và ra quyết định phê duyệt cuối cùng (Mua/Nắm giữ/Bán).
- **Nhà Giao Dịch (Trader):** Thiết lập kế hoạch thực thi chi tiết dựa trên chiến lược đã được duyệt.

---

## Giao Diện Trực Quan & Tương Tác

Nền tảng cung cấp một giao diện người dùng chuyên nghiệp, cho phép giám sát luồng công việc của các đặc vụ và tương tác dữ liệu theo thời gian thực.

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

## Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu hệ thống
- **Môi trường:** Linux/macOS hoặc WSL (Windows)
- **Node.js:** `>= 20.9.0` (Khuyến nghị dùng `nvm`)
- **Python:** `>= 3.10`
- **Docker:** Docker & Docker Compose (cho môi trường Production)

### 1. Triển khai bằng Docker (Production)
Cách nhanh nhất và ổn định nhất để chạy ứng dụng.

```bash
# Xây dựng và khởi động toàn bộ hệ thống
docker compose up -d --build

# Kiểm tra trạng thái các containers
docker compose ps
```
> **Lưu ý:** UI sẽ chạy tại `http://localhost:3000` và Backend API tại `http://localhost:8000`. 
> Tài khoản Admin mặc định: `admin@tradingagents.com` / `admin123`.

### 2. Triển khai Local (Development)

#### Bước 2.1: Khởi chạy Backend
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
alembic upgrade head           # Chạy database migrations
python scripts/seed_admin.py   # Tạo tài khoản admin mặc định
fastapi dev main.py --host 0.0.0.0 --port 8000
```

#### Bước 2.2: Khởi chạy Frontend (UI)
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

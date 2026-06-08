# Hướng dẫn Sử dụng Hệ thống AI Trading Agents
*(Dành cho nhà đầu tư và chuyên viên tài chính)*

## 1. Giới thiệu
**Trading Agents** là một hệ thống AI phân tích tài chính chuyên sâu được thiết kế để hoạt động như một **Quỹ đầu tư thu nhỏ (Micro Hedge Fund)**. Trợ lý này không chỉ là một chatbot trả lời câu hỏi thông thường, mà có khả năng tự động thực hiện các quy trình nghiên cứu, tranh luận và ra quyết định chặt chẽ nhằm giúp bạn tối ưu hóa hiệu quả đầu tư trên thị trường chứng khoán Việt Nam.

## 2. Logic Hoạt động của Hệ thống (Tại sao bạn có thể tin tưởng AI?)
Để đem lại sự tin cậy tối đa cho các nhà đầu tư chuyên nghiệp, hệ thống không sử dụng một AI đơn lẻ để trả lời mọi thứ (dễ dẫn đến sự "ảo giác" - hallucination). Thay vào đó, chúng tôi áp dụng kiến trúc **Đa tác tử (Multi-Agent System)**. Hệ thống được chia làm nhiều phòng ban với các chuyên gia (Agents) hoạt động độc lập và giám sát lẫn nhau:

1. **Bộ phận Thu thập Dữ liệu Tự động (Data Retrieval):** Tự động cào (scrape) và tổng hợp dữ liệu thực tế từ các nguồn tài chính uy tín của Việt Nam. Dữ liệu bao gồm: Báo cáo tài chính, tin tức doanh nghiệp, công bố thông tin chính thức, dòng tiền ETF, và giao dịch khối ngoại. Mọi phân tích đều dựa trên **dữ liệu thực** chứ không phải phỏng đoán.
2. **Bộ phận Phân tích Chuyên biệt (Analysts):**
   - *Chuyên viên Phân tích Cơ bản:* Chuyên mổ xẻ các số liệu kinh doanh, định giá.
   - *Chuyên viên Phân tích Kỹ thuật:* Đánh giá dòng tiền, chỉ báo động lượng (RSI, MACD) và hành vi giá.
   - *Chuyên viên Tin tức & Tâm lý:* Đo lường tâm lý thị trường, sự hưng phấn/sợ hãi từ mạng xã hội và báo chí.
3. **Bộ phận Nghiên cứu & Phản biện (Research & Debate):** Để tránh "Thiên kiến xác nhận" (Confirmation Bias), hệ thống bắt buộc một Agent bảo vệ quan điểm Tăng (Bull) và một Agent bảo vệ quan điểm Giảm (Bear). Chúng sẽ tranh luận gay gắt dựa trên bằng chứng dữ liệu đưa ra bởi đội ngũ phân tích.
4. **Bộ phận Quản trị & Ra quyết định (Risk & Portfolio Management):** Quản lý rủi ro sẽ kiểm tra các luận điểm. Sau đó, Quản lý Danh mục Đầu tư (Portfolio Manager) sẽ đưa ra **Quyết định cuối cùng** khách quan nhất (Mua/Bán/Nắm giữ) kèm theo điểm vào/ra lệnh từ Trader.

## 3. Hệ thống giúp giải quyết vấn đề gì?
- **Tiết kiệm hàng giờ đồng hồ:** Tự động tổng hợp và xử lý lượng lớn thông tin phân mảnh trên thị trường.
- **Góc nhìn Đa chiều & Khách quan:** Phân tích cổ phiếu toàn diện từ cả góc nhìn cơ bản lẫn kỹ thuật, từ kịch bản tốt nhất đến kịch bản rủi ro nhất.
- **Trực quan hóa Dữ liệu:** Tự động vẽ biểu đồ giá, tính toán và hiển thị trực quan thông tin ngay trên giao diện nền tảng.
- **Chiến lược Rõ ràng:** Cung cấp báo cáo đầu tư chi tiết với khuyến nghị hành động, điểm cắt lỗ và chốt lời cụ thể, bảo vệ vốn của bạn.

## 4. Các Luồng Xử Lý (Workflows) Chính

Hệ thống hoạt động dựa trên 2 luồng xử lý tùy thuộc vào độ phức tạp trong câu hỏi của bạn:

### 4.1. Luồng Trợ lý Nhanh (Quick Assistant)
- **Mục đích:** Giải quyết các câu hỏi cần đáp án ngay lập tức.
- **Đặc điểm:** AI sẽ phân tích câu hỏi và tự động gọi công cụ tra cứu dữ liệu tức thời (xem giá, đọc tin mới, tính toán RSI, MACD, định giá nhanh hay vẽ biểu đồ) và phản hồi lập tức.
- **Khi nào sử dụng:** Khi bạn cần tra cứu dữ liệu nhanh, kiểm tra một chỉ báo đơn lẻ giữa phiên giao dịch.

### 4.2. Luồng Nghiên Cứu Chuyên Sâu (Deep Research)
- **Mục đích:** Thực hiện một báo cáo phân tích đầu tư và khuyến nghị giao dịch toàn diện.
- **Đặc điểm:** AI sẽ kích hoạt toàn bộ bộ máy quỹ đầu tư thu nhỏ (được mô tả ở Mục 2). Luồng này mất nhiều thời gian chạy hơn nhưng sẽ cho ra kết quả chất lượng cao nhất.
- **Khi nào sử dụng:** Khi bạn cân nhắc giải ngân vốn lớn vào một cổ phiếu và cần một chiến lược đầu tư đầy đủ.

## 5. Các Tình Huống Sử Dụng (Use Cases) & Gợi Ý Câu Lệnh

Để hệ thống hoạt động hiệu quả nhất, hãy sử dụng các câu lệnh (prompt) rõ ràng:

### Tình huống 1: Cập nhật thông tin nhanh
- *Ví dụ 1:* "Hôm nay VNINDEX ra sao? Có tin tức gì mới về cổ phiếu VCB không?"
- *Ví dụ 2:* "Cho tôi xem khối ngoại hôm nay mua bán ròng mã FPT thế nào."
- *Kết quả:* AI sẽ đọc tin tức, lấy dữ liệu bảng điện và trả lời ngắn gọn.

### Tình huống 2: Phân tích kỹ thuật & Trực quan hóa
- *Ví dụ 1:* "Vẽ biểu đồ giá cổ phiếu HPG trong 1 tháng qua."
- *Ví dụ 2:* "Chỉ báo RSI và MACD của SSI hiện tại đang báo mua hay bán?"
- *Kết quả:* AI sẽ vẽ biểu đồ trực tiếp trên màn hình hoặc trả về mức tính toán của chỉ báo tức thì.

### Tình huống 3: Yêu cầu Báo cáo Phân tích Chuyên sâu (Luồng Deep Research)
- *Ví dụ 1:* "Hãy phân tích chuyên sâu mã cổ phiếu MWG, có nên mua vào lúc này không?"
- *Ví dụ 2:* "Đánh giá tiềm năng và rủi ro của cổ phiếu SSI trong quý này. Viết báo cáo chi tiết."
- *Kết quả:* AI sẽ khởi động quy trình Research. Sau khi hoàn tất, bạn sẽ nhận được một **Báo cáo tổng hợp chuyên nghiệp** trên màn hình bao gồm:
  1. Tóm tắt chiến lược đầu tư.
  2. Khuyến nghị hành động (Mua/Bán/Nắm giữ) kèm Mức độ tự tin (Confidence %).
  3. Giá mục tiêu, điểm cắt lỗ.
  4. Các luận điểm Tích cực (Bull Points) và Tiêu cực (Bear Points).
  5. Bảng dự báo xu hướng giá trong các ngày tới.

---

## 6. Hướng dẫn Thiết lập Cấu hình (Configurations) Tối ưu

Để cá nhân hóa theo phong cách đầu tư và tối ưu hóa kết quả, hệ thống cung cấp bảng Cài đặt (Settings/Configurations). Dưới đây là ý nghĩa và cách chọn:

### 6.1. Tùy chọn Mô hình Trí tuệ Nhân tạo (LLM Models)
Bạn có thể tinh chỉnh mô hình AI cho từng loại tác vụ:
- **LLM Provider (Nhà cung cấp):** Chọn hạ tầng AI mong muốn (OpenAI, Anthropic, Azure...).
- **Model (Mô hình chính):** Mô hình được dùng cho việc giao tiếp và trả lời nhanh (ví dụ: `gpt-4o`).
- **Deep Think Model (Mô hình Tư duy Sâu):** AI lõi sẽ chạy luồng Nghiên cứu chuyên sâu. 
  - *Mẹo:* Luôn chọn các mô hình thông minh nhất (như `o1`, `o3-mini`, `gpt-4o` hoặc `claude-3-5-sonnet`) để báo cáo đầu tư có độ chính xác cao.
- **Quick Think Model (Mô hình Tư duy Nhanh):** AI chuyên bóc tách dữ liệu nhanh. 
  - *Mẹo:* Nên chọn các mô hình có tốc độ phản hồi siêu tốc và chi phí thấp (như `gpt-4o-mini`, `claude-3-haiku`).

### 6.2. Lựa chọn Đội ngũ Phân tích (Active Teams)
Đối với luồng Deep Research, bạn có thể tùy chọn bật/tắt các đội phân tích chuyên biệt dựa trên trường phái đầu tư của bạn:
- **Fundamentals (Cơ bản):** Định giá, phân tích sức khỏe tài chính. Cực kỳ quan trọng đối với nhà đầu tư giá trị, mua nắm giữ dài hạn.
- **Technical (Kỹ thuật):** Phân tích biểu đồ, động lượng giá. Thiết yếu đối với nhà giao dịch lướt sóng (Trader).
- **Sentiment (Tâm lý):** Đo lường hưng phấn/sợ hãi của đám đông. Rất hữu ích khi thị trường biến động mạnh, giúp tìm đỉnh/đáy.
- **News (Tin tức):** Rà soát các tin tức vĩ mô và rủi ro từ truyền thông.

### 6.3. Các Tham số Tinh chỉnh Khác
- **Reasoning Effort (Nỗ lực suy luận):** Điều chỉnh mức độ thời gian AI dành ra để "suy nghĩ" (`low`, `medium`, `high`). 
  - *Mẹo:* Nếu dùng mô hình họ `o1/o3` của OpenAI cho các bài toán phân tích rủi ro phức tạp, hãy đặt ở mức `high`. Tuy thời gian đợi sẽ lâu hơn nhưng quyết định sẽ sắc bén và thận trọng hơn rất nhiều.
- **Temperature (Độ sáng tạo / Ngẫu nhiên):** Giá trị từ 0.0 đến 1.0. 
  - *Mẹo tối ưu:* Trong lĩnh vực tài chính, **LUÔN giữ mức Temperature thấp (0.0 - 0.2)** để AI trả lời bám sát số liệu thực tế, logic, và KHÔNG tự bịa ra thông tin.

### 💡 Tóm tắt: Cách setup tối ưu theo phong cách đầu tư
1. **Phong cách Lướt sóng Nhanh (Day Trading/Swing Trading):** 
   - *Teams:* Chỉ bật `Technical`, `Sentiment`, `News` (Tắt Cơ bản để báo cáo chạy cực nhanh).
   - *Temperature:* `0.0`.
2. **Phong cách Đầu tư Dài hạn (Value Investing):** 
   - *Deep Think Model:* `o1` hoặc `gpt-4o`.
   - *Teams:* Bật toàn bộ 4 đội phân tích.
   - *Reasoning Effort:* `high` (Cho phép AI suy nghĩ thật kỹ trước khi chốt khuyến nghị).
   - *Temperature:* `0.0`.

---
**Lời khuyên:** Đừng ngại thử nghiệm với các cấu hình và đội ngũ phân tích khác nhau để tìm ra người trợ lý đầu tư ảo hiểu ý bạn nhất!

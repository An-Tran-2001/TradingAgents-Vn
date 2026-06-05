import requests
import pandas as pd
from typing import Annotated
from datetime import datetime
import re
from .symbol_utils import NoMarketDataError, normalize_symbol

def _strip_vn_suffix(symbol: str) -> str:
    """Loại bỏ đuôi .VN nếu có để tương thích với các API nội địa Việt Nam."""
    symbol = symbol.upper().strip()
    if symbol.endswith(".VN"):
        return symbol[:-3]
    return symbol

def parse_asp_date(date_str):
    if not date_str:
        return ""
    match = re.search(r'\d+', date_str)
    if match:
        timestamp = int(match.group(0)) / 1000
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
    return date_str

def get_tcbs_stock_data(
    symbol: Annotated[str, "ticker symbol of the company"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
):
    """Lấy dữ liệu OHLCV từ TCBS API."""
    canonical = _strip_vn_suffix(normalize_symbol(symbol))
    try:
        start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
        end_ts = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp())
        
        url = f"https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker={canonical}&type=stock&resolution=D&from={start_ts}&to={end_ts}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if not data or 'data' not in data or not data['data']:
            raise NoMarketDataError(symbol, canonical, f"no rows between {start_date} and {end_date} from TCBS")
            
        df = pd.DataFrame(data['data'])
        df['Date'] = pd.to_datetime(df['tradingDate']).dt.tz_localize(None)
        df = df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })
        df = df.set_index('Date')
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
        
        csv_string = df.to_csv()
        
        header = f"# Stock data for {canonical} from {start_date} to {end_date} (Source: TCBS)\n"
        header += f"# Total records: {len(df)}\n"
        header += f"# Data retrieved on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        return header + csv_string
    except NoMarketDataError:
        raise
    except Exception as e:
        raise NoMarketDataError(symbol, canonical, f"TCBS API Error: {str(e)}")


async def stream_vietnam_macro_data(
    indicator: Annotated[str, "Tên chỉ số vĩ mô (cpi, gdp, interest_rate, exchange_rate)"],
    target_date: Annotated[str, "Ngày hoặc năm cần lấy dữ liệu"] = None,
    config: dict = None,
    browser_id: str = None
):
    """Sử dụng Browser Agent (Playwright) để tự động crawl và lấy dữ liệu vĩ mô Việt Nam."""
    try:
        from tradingagents.agents.analysts.macro_browser_agent import stream_browser_research
    except ImportError:
        yield {"type": "final_result", "content": f"# Macro Data: {indicator}\nLỗi: Không thể tải MacroBrowserAgent. Đảm bảo file được tạo đúng."}
        return
        
    indicator_lower = indicator.lower()
    
    if target_date:
        if len(target_date) == 4 and target_date.isdigit():
            date_context = f" cho năm {target_date}"
        else:
            date_context = f" tính đến thời điểm {target_date}"
    else:
        date_context = " mới nhất"
    
    # Định tuyến URL theo loại chỉ số
    if "cpi" in indicator_lower:
        url = "https://www.nso.gov.vn/gia"
        query = f"Lấy dữ liệu CPI{date_context} (theo tháng và theo năm). Nếu không thấy hoặc trang web lỗi, hãy tìm trên Google."
    elif "gdp" in indicator_lower or "fdi" in indicator_lower:
        url = "https://www.nso.gov.vn/en/statistical-data/"
        query = f"Lấy dữ liệu {indicator.upper()}{date_context}. Nếu không thấy hoặc trang web lỗi, hãy tìm trên Google."
    elif "interest" in indicator_lower or "lãi suất" in indicator_lower:
        url = "https://www.sbv.gov.vn"
        query = f"Lấy dữ liệu Lãi suất điều hành (Tái cấp vốn, Tái chiết khấu) hoặc OMO{date_context}. Nếu không thấy, hãy tìm trên Google."
    elif "exchange" in indicator_lower or "tỷ giá" in indicator_lower:
        url = "https://www.sbv.gov.vn"
        query = f"Lấy dữ liệu Tỷ giá trung tâm (USD/VND){date_context}. Nếu không thấy, hãy tìm trên Google."
    elif "pmi" in indicator_lower:
        url = "https://www.spglobal.com/marketintelligence/en/mi/products/pmi.html"
        query = f"Lấy dữ liệu PMI sản xuất của Việt Nam (S&P Global PMI Vietnam){date_context}. Nếu không thấy, hãy tìm trên Google."
    elif "export" in indicator_lower or "import" in indicator_lower or "xuất nhập khẩu" in indicator_lower:
        url = "https://www.customs.gov.vn"
        query = f"Lấy dữ liệu kim ngạch Xuất nhập khẩu{date_context}. Nếu không thấy, hãy tìm trên Google."
    else:
        url = "https://www.google.com"
        query = f"Tìm kiếm dữ liệu vĩ mô Việt Nam: {indicator}{date_context}. Hãy ưu tiên các nguồn uy tín như CafeF, VnEconomy, GSO."

    # Gọi tác vụ Agentic Web Browser
    async for event in stream_browser_research(query=query, start_url=url, config=config, browser_id=browser_id):
        if event["type"] == "final_result":
            event["content"] = f"# Macro Data: {indicator}\nNguồn tự động: Browser Agent\nKết quả:\n{event['content']}"
        yield event


def get_cafef_news(
    symbol: Annotated[str, "Mã chứng khoán"],
):
    """Lấy báo cáo phân tích và tin tức từ CafeF."""
    canonical = _strip_vn_suffix(normalize_symbol(symbol))
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/BaoCaoPhanTich.ashx?Symbol={canonical}&PageIndex=1&PageSize=5"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có báo cáo phân tích nào mới cho {canonical}."
        
        lines = [f"# Báo cáo phân tích mới nhất về {canonical} (Từ CafeF)"]
        for item in res['Data']:
            title = item.get('Title', '')
            date = parse_asp_date(item.get('DateDeploy', ''))
            lines.append(f"- [{date}] {title}")
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy báo cáo phân tích cho {canonical}: {str(e)}"

async def stream_market_news(
    ticker: str,
    target_date: str = None,
    config: dict = None,
    browser_id: str = None
):
    """Sử dụng API CafeF và Browser Agent để lấy tin tức chứng khoán."""
    canonical = _strip_vn_suffix(ticker)
    
    # --- BƯỚC 1: Lấy tin cơ bản từ CafeF API ---
    yield {
        "type": "agent_log",
        "step": 0,
        "agent": "System",
        "log_type": "Tool",
        "content": f"Đang lấy tin tức từ CafeF API cho mã {canonical}...",
        "time": "now"
    }
    
    cafef_news = get_cafef_news(canonical)
    
    try:
        from tradingagents.agents.analysts.macro_browser_agent import stream_browser_research
    except ImportError:
        yield {"type": "final_result", "content": f"{cafef_news}\n\nLỗi: Không thể tải MacroBrowserAgent để lấy thêm tin."}
        return

    # --- BƯỚC 2: Quyết định URL theo target_date ---
    import datetime
    is_recent = True
    if target_date:
        try:
            target_dt = datetime.datetime.strptime(target_date, "%Y-%m-%d")
            delta = datetime.datetime.now() - target_dt
            if delta.days > 14: # Nếu cũ hơn 14 ngày thì coi là cũ
                is_recent = False
        except Exception:
            pass # Nếu parse lỗi, mặc định là recent
            
    if is_recent:
        url = f"https://baomoi.com/tim-kiem/{canonical}.epi"
        query = f"Đọc các tiêu đề và tóm tắt tin tức mới nhất về mã chứng khoán {canonical} trên trang BaoMoi. Tóm tắt các sự kiện quan trọng."
        log_msg = f"Sử dụng Browser Agent truy cập BaoMoi để lấy tin tức mới nhất..."
    else:
        url = "https://www.google.com"
        query = f"Tìm kiếm tin tức về mã chứng khoán {canonical} xung quanh thời điểm {target_date}. Đọc các tiêu đề và tóm tắt sự kiện."
        log_msg = f"Sử dụng Browser Agent truy cập Google tìm tin tức quá khứ ({target_date})..."

    yield {
        "type": "agent_log",
        "step": 0,
        "agent": "System",
        "log_type": "Tool",
        "content": log_msg,
        "time": "now"
    }

    async for event in stream_browser_research(query=query, start_url=url, config=config, browser_id=browser_id):
        if event["type"] == "final_result":
            event["content"] = f"{cafef_news}\n\n# Tin tức bổ sung từ Browser Agent\nNguồn: {'BaoMoi' if is_recent else 'Google'}\n\n{event['content']}"
        yield event


def get_hose_announcements(
    symbol: Annotated[str, "Mã chứng khoán"],
):
    """Lấy sự kiện / lịch chốt quyền từ CafeF."""
    canonical = _strip_vn_suffix(normalize_symbol(symbol))
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/LichSuKien.ashx?Symbol={canonical}"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có sự kiện nào mới cho {canonical}."
            
        lines = [f"# Lịch sự kiện & Công bố thông tin của {canonical} (Từ CafeF)"]
        for item in res['Data']:
            date = parse_asp_date(item.get('Time', ''))
            texts = item.get('Text', [])
            if texts:
                lines.append(f"- [{date}] " + " | ".join(texts))
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy sự kiện cho {canonical}: {str(e)}"


def get_fiin_fundamentals(
    ticker: Annotated[str, "ticker symbol of the company"],
    curr_date: Annotated[str, "current date"] = None
):
    """Lấy chỉ số tài chính cơ bản từ CafeF."""
    canonical = _strip_vn_suffix(normalize_symbol(ticker))
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/ChiSoTaiChinh.ashx?Symbol={canonical}"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có dữ liệu cơ bản cho {canonical}."
            
        lines = [f"# Chỉ số cơ bản của {canonical} (Từ CafeF)"]
        for item in res['Data']:
            text = item.get('Text') or ''
            text = text.replace('<span>', '').replace('</span>', '')
            val = item.get('Value', '')
            if text and val:
                lines.append(f"- {text}: {val}")
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy fundamental cho {canonical}: {str(e)}"

# CÁC BÁO CÁO TÀI CHÍNH (Nguồn: FiinGroup / WiFeed)
def get_fiin_balance_sheet(ticker: str, freq: str = "quarterly", curr_date: str = None):
    """Lấy số liệu tài sản, nguồn vốn từ CafeF."""
    canonical = _strip_vn_suffix(ticker)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        lines = [f"# Bảng cân đối kế toán (Balance Sheet) cho {canonical} (Từ CafeF)"]
        # Type 1: Tài sản, Type 2: Nợ phải trả / Huy động vốn, Type 3: Vốn chủ sở hữu
        for t, name in [(1, "Chỉ tiêu 1 (Thường là Tổng Tài Sản)"), (2, "Chỉ tiêu 2 (Thường là Nợ phải trả/Nguồn vốn)"), (3, "Chỉ tiêu 3 (Thường là Vốn Chủ Sở Hữu)")]:
            url = f"https://cafef.vn/du-lieu/Ajax/PageNew/DataChiTieuByTime.ashx?Symbol={canonical}&Type={t}"
            res = requests.get(url, headers=headers, timeout=10).json()
            if 'Data' in res and res['Data']:
                # Find the requested symbol
                for item in res['Data']:
                    if item.get('Symbol') == canonical:
                        lines.append(f"- {name}: {item.get('ValueFormat', item.get('Value', 'N/A'))} (Năm {item.get('Year', '')} Q{item.get('Quarter', '')})")
                        break
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy Bảng cân đối kế toán cho {canonical}: {str(e)}"

def get_fiin_cashflow(ticker: str, freq: str = "quarterly", curr_date: str = None):
    """Lấy dòng tiền từ CafeF."""
    canonical = _strip_vn_suffix(ticker)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        lines = [f"# Báo cáo lưu chuyển tiền tệ (Cashflow) cho {canonical} (Từ CafeF)"]
        for t, name in [(4, "Chỉ tiêu 4 (Dòng tiền kinh doanh/EPS)"), (5, "Chỉ tiêu 5 (Dòng tiền đầu tư/P/E)"), (6, "Chỉ tiêu 6 (Dòng tiền tài chính/ROA)")]:
            url = f"https://cafef.vn/du-lieu/Ajax/PageNew/DataChiTieuByTime.ashx?Symbol={canonical}&Type={t}"
            res = requests.get(url, headers=headers, timeout=10).json()
            if 'Data' in res and res['Data']:
                for item in res['Data']:
                    if item.get('Symbol') == canonical:
                        lines.append(f"- {name}: {item.get('ValueFormat', item.get('Value', 'N/A'))} (Năm {item.get('Year', '')} Q{item.get('Quarter', '')})")
                        break
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy Lưu chuyển tiền tệ cho {canonical}: {str(e)}"

def get_fiin_income_statement(ticker: str, freq: str = "quarterly", curr_date: str = None):
    """Lấy Kế hoạch kinh doanh từ CafeF (thay thế cho Income Statement tạm thời)."""
    canonical = _strip_vn_suffix(ticker)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/KeHoachKinhDoanh.ashx?Symbol={canonical}"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có dữ liệu Kế hoạch kinh doanh cho {canonical}."
            
        lines = [f"# Kế hoạch kinh doanh (Business Plan / Income Targets) cho {canonical} (Từ CafeF)"]
        for year_data in res['Data']:
            year = year_data.get('Year')
            lines.append(f"\n## Năm {year}")
            for val in year_data.get('Values', []):
                name = val.get('Name', '')
                value = val.get('Value', '')
                if name and value:
                    lines.append(f"- {name}: {value}")
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy Kế hoạch kinh doanh cho {canonical}: {str(e)}"

# GIAO DỊCH NỘI BỘ (Nguồn: HOSE, HNX, VSDC)
def get_official_insider_transactions(ticker: str):
    """Lấy giao dịch nội bộ từ nguồn chính thức HOSE/HNX/VSDC (CEO buy/sell, Board buy/sell)."""
    canonical = _strip_vn_suffix(ticker)
    return f"# Giao dịch nội bộ chính thức cho {canonical}\nNguồn: HOSE / HNX / VSDC (Mock)"

# CÁC TOOL MỚI BỔ SUNG THEO KIẾN TRÚC VIỆT NAM
def get_major_shareholders(ticker: str):
    """Cơ cấu cổ đông lớn (Từ CafeF)."""
    canonical = _strip_vn_suffix(ticker)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/CoCauSoHuu.ashx?Symbol={canonical}"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có dữ liệu cơ cấu cổ đông cho {canonical}."
            
        data = res['Data']
        lines = [f"# Cơ cấu cổ đông lớn cho {canonical} (Từ CafeF)"]
        
        # Tỷ lệ sở hữu
        lines.append("## Tỷ lệ sở hữu chung:")
        lines.append(f"- Nước ngoài: {data.get('NuocNgoai', 'N/A')}")
        lines.append(f"- Nhà nước: {data.get('NhaNuoc', 'N/A')}")
        lines.append(f"- Khác: {data.get('Khac', 'N/A')}")
        
        # Danh sách cổ đông lớn
        lines.append("\n## Danh sách cổ đông lớn:")
        for cd in data.get('CoDongSoHuu', []):
            name = cd.get('Name', '')
            volume = cd.get('AssetVolume', '')
            rate = cd.get('AssetRate', '')
            if name:
                lines.append(f"- {name}: {volume} cổ phiếu ({rate})")
                
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy cơ cấu cổ đông cho {canonical}: {str(e)}"

def get_vn_realtime_trading_data(ticker: str):
    """Lấy thông tin giao dịch Real-time, Khối ngoại, Giá Trần/Sàn từ CafeF."""
    canonical = _strip_vn_suffix(ticker)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url_header = f"https://cafef.vn/du-lieu/Ajax/PageNew/PriceRealTimeHeader.ashx?Symbol={canonical}"
        url_detail = f"https://cafef.vn/du-lieu/Ajax/PageNew/RealtimePrice.ashx?Symbol={canonical}"
        
        res_header = requests.get(url_header, headers=headers, timeout=10).json()
        res_detail = requests.get(url_detail, headers=headers, timeout=10).json()
        
        lines = [f"# Thông tin giao dịch Real-time cho {canonical} (Từ CafeF)"]
        
        if 'Data' in res_header and res_header['Data']:
            h_data = res_header['Data']  # Fix: Data is a dict, not a list
            lines.append("## Giá và Khối lượng hiện tại:")
            lines.append(f"- Sàn giao dịch: {h_data.get('MaSan', '')}")
            lines.append(f"- Giá hiện tại: {h_data.get('Gia', '')}")
            lines.append(f"- Giá tham chiếu: {h_data.get('GiaThamChieu', '')}")
            lines.append(f"- Khối lượng khớp: {h_data.get('KhoiLuong', '')}")
            lines.append(f"- Thời gian cập nhật: {h_data.get('ThoiGian', '')}")
            
        if 'Data' in res_detail and res_detail['Data']:
            d_data = res_detail['Data']  # Fix: Data is a dict, not a list
            lines.append("\n## Biên độ & Thống kê:")
            lines.append(f"- Giá Trần (Ceiling): {d_data.get('GiaTran', '')}")
            lines.append(f"- Giá Sàn (Floor): {d_data.get('GiaSan', '')}")
            lines.append(f"- Giá Mở cửa: {d_data.get('GiaMoCua', '')}")
            lines.append(f"- Giá Cao/Thấp nhất: {d_data.get('GiaCaoNhat', '')} - {d_data.get('GiaThapNhat', '')}")
            
            lines.append("\n## Giao dịch Khối ngoại:")
            lines.append(f"- Khối lượng Mua: {d_data.get('KhoiLuongNNMua', '')} (Giá trị: {d_data.get('GiaTriNNMua', '')})")
            lines.append(f"- Khối lượng Bán: {d_data.get('KhoiLuongNNBan', '')} (Giá trị: {d_data.get('GiaTriNNBan', '')})")
            lines.append(f"- Room khối ngoại còn lại: {d_data.get('RoomConLai', '')}")
            
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy dữ liệu realtime cho {canonical}: {str(e)}"

async def stream_etf_flow(
    config: dict = None,
    browser_id: str = None
):
    """Sử dụng Browser Agent (Playwright) để vào Google tìm kiếm dòng tiền ETF."""
    yield {
        "type": "agent_log",
        "step": 0,
        "agent": "System",
        "log_type": "Tool",
        "content": "Sử dụng Browser Agent truy cập Google để tìm kiếm dòng tiền ETF tại Việt Nam...",
        "time": "now"
    }

    try:
        from tradingagents.agents.analysts.macro_browser_agent import stream_browser_research
    except ImportError:
        yield {"type": "final_result", "content": "# Dòng tiền ETF\nLỗi: Không thể tải MacroBrowserAgent."}
        return
        
    url = "https://www.google.com"
    query = "Tìm kiếm thông tin mới nhất về dòng tiền ETF tại thị trường chứng khoán Việt Nam (ví dụ Fubon ETF, Diamond ETF, VN30 ETF...). Đọc các bài viết mới nhất để tổng hợp xem khối ngoại đang mua ròng hay bán ròng qua kênh ETF."

    async for event in stream_browser_research(query=query, start_url=url, config=config, browser_id=browser_id):
        if event["type"] == "final_result":
            event["content"] = f"# Dòng tiền ETF\nNguồn tự động: Browser Agent (Google Search)\nKết quả:\n{event['content']}"
        yield event

def get_sector_data(symbol: str = ""):
    """Lấy Dữ liệu so sánh cùng ngành từ CafeF (Top các công ty cùng ngành)."""
    canonical = _strip_vn_suffix(symbol) if symbol else "VCB"
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/DataChiTieuByTime.ashx?Symbol={canonical}&Type=1"
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data']:
            return f"Không có dữ liệu ngành cho mã {canonical}."
            
        data = res['Data']
        # Sắp xếp giảm dần theo giá trị
        data = sorted(data, key=lambda x: x.get('Value', 0), reverse=True)
        
        lines = [f"# Dữ liệu các công ty cùng ngành với {canonical} (Xếp hạng theo Quy mô/Chỉ tiêu 1) - Nguồn CafeF"]
        for idx, item in enumerate(data[:15]): # Top 15
            sym = item.get('Symbol', '')
            val = item.get('ValueFormat', '')
            prefix = "[MÃ CỦA BẠN] " if sym == canonical else ""
            lines.append(f"{idx+1}. {prefix}{sym}: {val}")
            
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy dữ liệu ngành cho {canonical}: {str(e)}"

def get_market_breadth(start_date: str, end_date: str):
    """Lấy dữ liệu lịch sử VNINDEX (Market Trend) từ CafeF."""
    try:
        from datetime import datetime
        start_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_obj = datetime.strptime(end_date, "%Y-%m-%d")
        start_str = start_obj.strftime("%d/%m/%Y")
        end_str = end_obj.strftime("%d/%m/%Y")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
        url = f"https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx?ExchangeType=HOSE&Symbol=VNINDEX&StartDate={start_str}&EndDate={end_str}&PageIndex=1&PageSize=50"
        
        res = requests.get(url, headers=headers, timeout=10).json()
        if 'Data' not in res or not res['Data'] or 'Data' not in res['Data']:
            return f"Không có dữ liệu lịch sử VNINDEX từ {start_date} đến {end_date}."
            
        data = res['Data']['Data']
        
        lines = [f"# Lịch sử giao dịch VNINDEX từ {start_date} đến {end_date} (Nguồn CafeF)"]
        for item in data:
            ngay = item.get("Ngay", "")
            dong_cua = item.get("GiaDongCua", "")
            thay_doi = item.get("ThayDoi", "")
            kl_khop_lenh = item.get("KhoiLuongKhopLenh", "")
            lines.append(f"- Ngày {ngay}: Đóng cửa {dong_cua} | Thay đổi: {thay_doi} | KLGD: {kl_khop_lenh}")
            
        return "\n".join(lines)
    except Exception as e:
        return f"Lỗi khi lấy dữ liệu VNINDEX: {str(e)}"

async def stream_social_sentiment(
    ticker: str,
    config: dict = None,
    browser_id: str = None
):
    """Sử dụng Browser Agent (Playwright) để vào FireAnt tự động đọc tâm lý đám đông."""
    canonical = _strip_vn_suffix(ticker)
    
    yield {
        "type": "agent_log",
        "step": 0,
        "agent": "System",
        "log_type": "Tool",
        "content": f"Sử dụng Browser Agent truy cập FireAnt để lấy tâm lý xã hội cho {canonical}...",
        "time": "now"
    }

    try:
        from tradingagents.agents.analysts.macro_browser_agent import stream_browser_research
    except ImportError:
        yield {"type": "final_result", "content": f"# Tâm lý mạng xã hội cho {ticker}\nLỗi: Không thể tải MacroBrowserAgent."}
        return
        
    url = f"https://fireant.vn/ma-chung-khoan/{canonical}"
    query = f"""OBJECTIVE: Analyze the retail social sentiment for ticker {canonical} on FireAnt.

EXECUTION PLAN:
1. Navigate to the 'Cộng đồng' (Community) tab if not already there.
2. MANDATORY ACTION: The page uses lazy-loading. You MUST execute the `browser_scroll_browser` tool AT LEAST 3 TIMES to scroll down and load historical comments. Do NOT extract text until you have scrolled down multiple times.
3. Extract the loaded posts/comments regarding {canonical}.
4. Synthesize the overall retail sentiment.

OUTPUT REQUIREMENTS:
- Classify the overall sentiment as exactly one of: Bullish, Bearish, or Neutral.
- Provide a brief summary of the main narratives or topics discussed by retail investors."""

    async for event in stream_browser_research(query=query, start_url=url, config=config, browser_id=browser_id):
        if event["type"] == "final_result":
            event["content"] = f"# Tâm lý mạng xã hội cho {canonical}\nNguồn tự động: Browser Agent (FireAnt)\nKết quả:\n{event['content']}"
        yield event

def calculate_technical_indicators_logic(ticker: str, indicators: list):
    """Tính toán nhanh các chỉ báo kỹ thuật cơ bản."""
    canonical = _strip_vn_suffix(ticker)
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        from stockstats import StockDataFrame
        import pandas as pd
        import warnings
        warnings.simplefilter(action='ignore', category=FutureWarning)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=150)
        yf_ticker = f"{canonical}.VN"
        df = yf.download(yf_ticker, start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), progress=False)
        
        if df.empty:
            return f"Không thể lấy dữ liệu kỹ thuật cho {canonical} từ Yahoo Finance."
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df.columns = [col.lower() for col in df.columns]
        stock = StockDataFrame.retype(df.copy())
        
        res = [f"# Quick Technical Indicators cho {canonical}"]
        
        for ind in indicators:
            ind_upper = ind.upper()
            try:
                if ind_upper == "RSI":
                    val = stock['rsi_14'].iloc[-1]
                    if pd.isna(val):
                        status = "Không đủ dữ liệu"
                        val = 0
                    else:
                        status = "Quá mua" if val > 70 else "Quá bán" if val < 30 else "Trung tính"
                    res.append(f"- {ind_upper}: {val:.2f} ({status})")
                elif ind_upper == "MACD":
                    macd = stock['macd'].iloc[-1]
                    signal = stock['macds'].iloc[-1]
                    hist = stock['macdh'].iloc[-1]
                    if pd.isna(macd): macd = signal = hist = 0
                    trend = "Phân kỳ dương (Tốt)" if hist > 0 else "Phân kỳ âm (Xấu)"
                    res.append(f"- {ind_upper}: MACD={macd:.2f}, Signal={signal:.2f}, Hist={hist:.2f} -> {trend}")
                elif ind_upper.startswith("EMA") or ind_upper.startswith("SMA"):
                    period = ''.join(filter(str.isdigit, ind_upper))
                    if not period:
                        period = "20"
                    
                    if ind_upper.startswith("EMA"):
                        val = stock[f'close_{period}_ema'].iloc[-1]
                    else:
                        val = stock[f'close_{period}_sma'].iloc[-1]
                    if pd.isna(val): val = 0
                    res.append(f"- {ind_upper}: {val:,.0f} VND")
                else:
                    res.append(f"- {ind_upper}: Chưa hỗ trợ tự động tính toán.")
            except Exception as e:
                res.append(f"- {ind_upper}: Lỗi tính toán ({str(e)})")
                
        res.append(f"\n*(Dữ liệu cập nhật phiên gần nhất: {df.index[-1].strftime('%Y-%m-%d')})*")
        return "\n".join(res)
    except Exception as e:
        return f"Lỗi xử lý kỹ thuật cho {canonical}: {str(e)}"

def detect_candlestick_pattern_logic(ticker: str, timeframe: str):
    """Nhận diện mô hình nến gần nhất."""
    canonical = _strip_vn_suffix(ticker)
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        import pandas as pd
        import warnings
        warnings.simplefilter(action='ignore', category=FutureWarning)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=15)
        yf_ticker = f"{canonical}.VN"
        df = yf.download(yf_ticker, start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), progress=False)
        
        if df.empty or len(df) < 2:
            return f"Không đủ dữ liệu nến cho {canonical}."
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        curr = df.iloc[-1]
        prev = df.iloc[-2]
        
        c_open, c_high, c_low, c_close = curr['Open'], curr['High'], curr['Low'], curr['Close']
        p_open, p_high, p_low, p_close = prev['Open'], prev['High'], prev['Low'], prev['Close']
        
        c_body = abs(c_close - c_open)
        c_range = c_high - c_low
        c_is_green = c_close > c_open
        c_is_red = c_close < c_open
        
        p_body = abs(p_close - p_open)
        p_is_green = p_close > p_open
        p_is_red = p_close < p_open
        
        patterns = []
        
        if c_body < 0.1 * c_range:
            patterns.append("Doji (Lưỡng lự)")
            
        if p_is_red and c_is_green and c_close > p_open and c_open < p_close:
            patterns.append("Bullish Engulfing (Đảo chiều tăng)")
            
        if p_is_green and c_is_red and c_close < p_open and c_open > p_close:
            patterns.append("Bearish Engulfing (Đảo chiều giảm)")
            
        lower_shadow = c_open - c_low if c_is_green else c_close - c_low
        upper_shadow = c_high - c_close if c_is_green else c_high - c_open
        if c_body > 0 and lower_shadow >= 2 * c_body and upper_shadow < 0.2 * c_body:
            patterns.append("Hammer (Tín hiệu đáy)")
            
        if c_body > 0 and upper_shadow >= 2 * c_body and lower_shadow < 0.2 * c_body:
            patterns.append("Shooting Star (Tín hiệu đỉnh)")
            
        if not patterns:
            patterns.append("Nến thường (Không có mô hình đặc biệt)")
            
        return f"Mô hình nến gần nhất của {canonical} trên khung {timeframe} ({df.index[-1].strftime('%Y-%m-%d')}): {', '.join(patterns)}"
    except Exception as e:
        return f"Lỗi nhận diện nến cho {canonical}: {str(e)}"

def screen_stocks_logic(conditions: dict):
    """Lọc cổ phiếu theo điều kiện."""
    try:
        import concurrent.futures
        import re
        
        stocks = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG", 
                  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB", 
                  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"]
                  
        results = {}
        def fetch(ticker):
            return ticker, get_fiin_fundamentals(ticker)
            
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_ticker = {executor.submit(fetch, t): t for t in stocks}
            for future in concurrent.futures.as_completed(future_to_ticker):
                ticker, res = future.result()
                results[ticker] = res
                
        selected_stocks = []
        for ticker, data_str in results.items():
            pe_match = re.search(r'P/E:\s*([\d\.]+)', data_str)
            pb_match = re.search(r'P/B:\s*([\d\.]+)', data_str)
            
            pe = float(pe_match.group(1)) if pe_match else None
            pb = float(pb_match.group(1)) if pb_match else None
            
            match = True
            for k, v in conditions.items():
                k_up = k.upper()
                if "P/E" in k_up or "PE" in k_up:
                    if not pe:
                        match = False
                        break
                    v_val = float(re.sub(r'[^\d\.]', '', str(v)))
                    if "<" in str(v) and pe >= v_val: match = False
                    if ">" in str(v) and pe <= v_val: match = False
                elif "P/B" in k_up or "PB" in k_up:
                    if not pb:
                        match = False
                        break
                    v_val = float(re.sub(r'[^\d\.]', '', str(v)))
                    if "<" in str(v) and pb >= v_val: match = False
                    if ">" in str(v) and pb <= v_val: match = False
            
            if match:
                selected_stocks.append(ticker)
                
        cond_str = ", ".join([f"{k} {v}" for k, v in conditions.items()])
        res = [f"# Kết quả lọc cổ phiếu (Nhóm VN30)"]
        res.append(f"**Điều kiện:** {cond_str}")
        if selected_stocks:
            res.append("\n**Các mã thỏa mãn:** " + ", ".join(selected_stocks))
        else:
            res.append("\n**Không có mã nào trong VN30 thỏa mãn điều kiện.**")
            
        return "\n".join(res)
    except Exception as e:
        return f"Lỗi trong quá trình lọc cổ phiếu: {str(e)}"

def get_quick_valuation_logic(ticker: str):
    """Định giá nhanh."""
    canonical = _strip_vn_suffix(ticker)
    try:
        import re
        data_str = get_fiin_fundamentals(canonical)
        
        if "Không có dữ liệu" in data_str or "Lỗi" in data_str:
            return data_str
            
        pe_match = re.search(r'P/E:\s*([\d\.]+)', data_str)
        pb_match = re.search(r'P/B:\s*([\d\.]+)', data_str)
        eps_match = re.search(r'EPS cơ bản\s*[\*]?\s*\(nghìn đồng\):\s*([\d\.]+)', data_str)
        
        pe = float(pe_match.group(1)) if pe_match else None
        pb = float(pb_match.group(1)) if pb_match else None
        eps = float(eps_match.group(1)) * 1000 if eps_match else None
        
        res = [f"# Định giá nhanh cho {canonical}"]
        if pe is not None:
            res.append(f"- P/E hiện tại: {pe:.2f}")
            if pe < 10:
                res.append("  -> Đánh giá P/E: Khá thấp, có thể đang bị định giá rẻ hoặc doanh nghiệp gặp khó khăn.")
            elif pe < 18:
                res.append("  -> Đánh giá P/E: Mức hợp lý so với trung bình thị trường VNIndex.")
            else:
                res.append("  -> Đánh giá P/E: Mức cao, kỳ vọng tăng trưởng tương lai lớn hoặc đang bị định giá đắt.")
                
        if pb is not None:
            res.append(f"- P/B hiện tại: {pb:.2f}")
            if pb < 1:
                res.append("  -> Đánh giá P/B: Giao dịch dưới giá trị sổ sách.")
            elif pb > 3:
                res.append("  -> Đánh giá P/B: Giao dịch với mức Premium cao (gấp hơn 3 lần sổ sách).")
                
        if eps is not None:
            res.append(f"- EPS (Lợi nhuận trên cổ phiếu): {eps:,.0f} VNĐ")
            
        if pe is None and pb is None:
            res.append(data_str)
            
        return "\n".join(res)
    except Exception as e:
        return f"Lỗi lấy định giá nhanh cho {canonical}: {str(e)}"

def check_macro_correlation_logic(ticker: str, macro_variable: str):
    """
    Check the historical correlation between a stock and a macroeconomic variable.
    """
    canonical = _strip_vn_suffix(ticker)
    try:
        import yfinance as yf
        import pandas as pd
        from datetime import datetime, timedelta
        
        # Decide the proxy for the macro variable
        macro_var_lower = macro_variable.lower()
        macro_ticker = None
        macro_label = macro_variable
        
        if "usd" in macro_var_lower or "vnd" in macro_var_lower or "exchange" in macro_var_lower or "tỷ giá" in macro_var_lower:
            macro_ticker = "VND=X"
            macro_label = "Tỷ giá USD/VND"
        elif "interest" in macro_var_lower or "lãi suất" in macro_var_lower or "rate" in macro_var_lower:
            macro_ticker = "^TNX" # Using US 10Y Treasury as proxy for global interest rate trend
            macro_label = "Lãi suất (Proxy bằng US 10Y Treasury)"
        elif "oil" in macro_var_lower or "dầu" in macro_var_lower:
            macro_ticker = "CL=F" # Crude Oil
            macro_label = "Giá Dầu Thô (WTI)"
        elif "gold" in macro_var_lower or "vàng" in macro_var_lower:
            macro_ticker = "GC=F" # Gold
            macro_label = "Giá Vàng"
        elif "sp500" in macro_var_lower or "s&p" in macro_var_lower or "ck_my" in macro_var_lower:
            macro_ticker = "^GSPC"
            macro_label = "S&P 500"
        else:
            macro_ticker = "^VNINDEX.VN" # Fallback to market
            macro_label = "Thị trường chung (VNINDEX)"
            
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365) # 1 year correlation
        
        stock_data = yf.download(f"{canonical}.VN", start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), progress=False)['Close']
        macro_data = yf.download(macro_ticker, start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), progress=False)['Close']
        
        if stock_data.empty or macro_data.empty:
            return f"Không đủ dữ liệu để tính tương quan giữa {canonical} và {macro_label}."
            
        df = pd.concat([stock_data, macro_data], axis=1).dropna()
        df.columns = ['Stock', 'Macro']
        
        corr = df['Stock'].corr(df['Macro'])
        
        status = "Tương quan thuận mạnh" if corr >= 0.5 else "Tương quan nghịch mạnh" if corr <= -0.5 else "Tương quan thuận yếu" if corr > 0 else "Tương quan nghịch yếu"
        
        res = [
            f"# Đánh giá tương quan (1 năm qua)",
            f"- Cổ phiếu: {canonical}",
            f"- Biến số vĩ mô: {macro_label}",
            f"- Hệ số tương quan (Pearson): {corr:.2f}",
            f"- Đánh giá: {status}",
            f"\n*Lưu ý: Nếu hệ số > 0.5, hai tài sản thường di chuyển cùng chiều. Nếu < -0.5, chúng thường di chuyển ngược chiều.*"
        ]
        
        return "\n".join(res)
    except Exception as e:
        return f"Lỗi tính toán tương quan cho {canonical}: {str(e)}"

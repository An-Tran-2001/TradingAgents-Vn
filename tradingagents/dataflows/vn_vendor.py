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
    curr_date: Annotated[str, "Ngày hiện tại yyyy-mm-dd"] = None,
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
    
    date_context = f" tính đến thời điểm {curr_date}" if curr_date else " mới nhất"
    
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
            h_data = res_header['Data'][0]
            lines.append("## Giá và Khối lượng hiện tại:")
            lines.append(f"- Sàn giao dịch: {h_data.get('MaSan', '')}")
            lines.append(f"- Giá hiện tại: {h_data.get('Gia', '')}")
            lines.append(f"- Giá tham chiếu: {h_data.get('GiaThamChieu', '')}")
            lines.append(f"- Khối lượng khớp: {h_data.get('KhoiLuong', '')}")
            lines.append(f"- Thời gian cập nhật: {h_data.get('ThoiGian', '')}")
            
        if 'Data' in res_detail and res_detail['Data']:
            d_data = res_detail['Data'][0]
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

def get_etf_flow():
    """Dòng tiền ETF (Fubon ETF, Diamond ETF, VN30 ETF)."""
    return f"# Dòng tiền ETF hôm nay\nNguồn: HOSE / VSDC (Mock)\n- Fubon ETF: Mua ròng\n- Diamond ETF: Bán ròng"

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

def get_market_breadth():
    """Độ rộng thị trường (Advancers, Decliners, New Highs, New Lows)."""
    return f"# Độ rộng thị trường VNIndex\nNguồn: TCBS / WiFeed (Mock)\n- Advancers: 250\n- Decliners: 120"

def get_social_sentiment(ticker: str):
    """Tâm lý đám đông và mạng xã hội (FireAnt, Facebook chứng khoán, Stock forums)."""
    canonical = _strip_vn_suffix(ticker)
    return f"# Tâm lý mạng xã hội cho {canonical}\nNguồn: FireAnt / Facebook / Forums (Mock)\n- Trạng thái: Hưng phấn (Bullish)"

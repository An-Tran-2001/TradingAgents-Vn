import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail || message;
  }
}

export async function fetchClient(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get("access_token");

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (e) {
    // Network error (offline, CORS, connection refused)
    throw new ApiError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.", 0, "network_error");
  }

  if (!response.ok) {
    let detail = "Đã có lỗi xảy ra.";
    try {
      const errorData = await response.json();
      detail = errorData.detail || errorData.message || detail;
    } catch {
      detail = response.statusText;
    }

    const statusMessages: Record<number, string> = {
      400: `Yêu cầu không hợp lệ: ${detail}`,
      401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      403: "Bạn không có quyền thực hiện hành động này.",
      404: `Không tìm thấy dữ liệu: ${detail}`,
      409: `Xung đột dữ liệu: ${detail}`,
      422: `Dữ liệu không hợp lệ: ${detail}`,
      429: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      500: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
      502: "Máy chủ không phản hồi. Vui lòng thử lại sau.",
      503: "Dịch vụ tạm thời không khả dụng.",
    };

    const message = statusMessages[response.status] || `Lỗi ${response.status}: ${detail}`;
    throw new ApiError(message, response.status, detail);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) return null;
  return response.json();
}

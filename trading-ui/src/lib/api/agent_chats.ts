import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const agentChatsApi = {
  createSession: async (title: string, ticker?: string) => {
    const token = Cookies.get("access_token");
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, ticker }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
  },

  getSessions: async () => {
    const token = Cookies.get("access_token");
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/`, {
      method: "GET",
      headers,
    });
    if (!res.ok) throw new Error("Failed to get sessions");
    return res.json();
  },

  getSessionDetails: async (sessionId: number) => {
    const token = Cookies.get("access_token");
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "GET",
      headers,
    });
    if (!res.ok) throw new Error("Failed to get session details");
    return res.json();
  },
  
  updateSession: async (sessionId: number, title: string) => {
    const token = Cookies.get("access_token");
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update session");
    return res.json();
  },

  deleteSession: async (sessionId: number) => {
    const token = Cookies.get("access_token");
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete session");
    return res.json();
  },
  
  chatStream: async (sessionId: number, message: string, config: any = {}) => {
    const token = Cookies.get("access_token");
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, ...config }),
    });
    
    if (!res.ok) throw new Error("Failed to initiate chat stream");
    return res;
  }
};

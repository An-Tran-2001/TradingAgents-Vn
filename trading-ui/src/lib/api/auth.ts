import { fetchClient } from "./client";
import { LoginCredentials, User, TokenResponse } from "@/types/auth";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    // FastAPI OAuth2PasswordRequestForm expects form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    return fetchClient("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
  },

  getMe: async (): Promise<User> => {
    return fetchClient("/auth/me", {
      method: "GET",
    });
  },
};

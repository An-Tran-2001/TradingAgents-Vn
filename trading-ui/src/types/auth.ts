export interface User {
    id: number;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

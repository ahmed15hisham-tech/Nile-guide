
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { STORED_KEYS } from '../../../core/constants/Stored_keys';


export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  nationality: string;
}

export interface RegisterResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc?: string;
  userId?: number;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    
    'https://nileguideapi-dxg8dqgmebajfzcz.uaenorth-01.azurewebsites.net/api/auth';
    

  register(payload: RegisterPayload) {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, payload);
  }

  login(payload: LoginPayload) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload);
  }

  saveAuth(token: string, userId?: number) {
    localStorage.setItem(STORED_KEYS.USER_TOKEN, token);
    if (userId !== undefined && userId !== null) {
      localStorage.setItem(STORED_KEYS.USER_ID, String(userId));
    }
  }

  clearAuth() {
    localStorage.removeItem(STORED_KEYS.USER_TOKEN);
    localStorage.removeItem(STORED_KEYS.USER_ID);
  }
}
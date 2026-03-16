import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'teamflow_token';
    private readonly REFRESH_TOKEN_KEY = 'teamflow_refresh_token';
    private readonly EMAIL_KEY = 'teamflow_email';

    private http = inject(HttpClient);
    private router = inject(Router);

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    private isRefreshingSubject = new BehaviorSubject<boolean>(false);
    public isRefreshing$ = this.isRefreshingSubject.asObservable();
    public refreshTokenSubject = new BehaviorSubject<string | null>(null);

    constructor() {
        if (this.hasToken()) {
            this.isAuthenticatedSubject.next(true);
        }
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        const normalizedRequest = { ...request, email: request.email.toLowerCase().trim() };
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, normalizedRequest);
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        const normalizedRequest = { ...request, email: request.email.toLowerCase().trim() };
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, normalizedRequest).pipe(
            tap(response => this.handleAuthSuccess(response))
        );
    }

    refreshToken(refreshToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/refresh-token`, { refreshToken }).pipe(
            tap(response => this.handleAuthSuccess(response))
        );
    }

    logout(): void {
        this.http.post(`${this.API_URL}/logout`, {}).subscribe({
            next: () => this.clearSession(),
            error: () => this.clearSession()
        });
    }

    clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.EMAIL_KEY);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getUserEmail(): string | null {
        return localStorage.getItem(this.EMAIL_KEY);
    }

    hasToken(): boolean {
        return !!this.getToken();
    }

    isAuthenticated(): boolean {
        if (!this.hasToken()) return false;
        if (this.isTokenExpired()) {
            this.clearSession();
            return false;
        }
        return true;
    }

    private isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.exp) return false; return (payload.exp * 1000) < (Date.now() + 30000);
        } catch {
            return true;
        }
    }

    /** Decode JWT payload and return the userId (field 'userId' or 'id') */
    getCurrentUserId(): number | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId ?? payload.id ?? null;
        } catch {
            return null;
        }
    }

    isAdmin(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return !!payload.isAdmin;
        } catch {
            return false;
        }
    }

    private handleAuthSuccess(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(this.EMAIL_KEY, response.email);
        this.isAuthenticatedSubject.next(true);
    }
}

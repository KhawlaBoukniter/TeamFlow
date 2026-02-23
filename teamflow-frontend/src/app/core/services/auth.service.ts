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
    private readonly EMAIL_KEY = 'teamflow_email';

    private http = inject(HttpClient);
    private router = inject(Router);

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor() {
        if (this.hasToken()) {
            this.isAuthenticatedSubject.next(true);
        }
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, request);
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
            tap(response => this.handleAuthSuccess(response))
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.EMAIL_KEY);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getUserEmail(): string | null {
        return localStorage.getItem(this.EMAIL_KEY);
    }

    hasToken(): boolean {
        return !!this.getToken();
    }

    isAuthenticated(): boolean {
        return this.hasToken();
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

    private handleAuthSuccess(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.EMAIL_KEY, response.email);
        this.isAuthenticatedSubject.next(true);
    }
}

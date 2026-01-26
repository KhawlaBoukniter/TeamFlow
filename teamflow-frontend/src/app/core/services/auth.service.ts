import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = 'http://localhost:8080/api/auth';
    private readonly TOKEN_KEY = 'teamflow_token';
    private readonly EMAIL_KEY = 'teamflow_email';

    private http = inject(HttpClient);
    private router = inject(Router);

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor() {
        // Check token validity on service initialization
        if (this.hasToken()) {
            this.isAuthenticatedSubject.next(true);
        }
    }

    /**
     * Register a new user
     */
    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
            tap(response => this.handleAuthSuccess(response))
        );
    }

    /**
     * Login user
     */
    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
            tap(response => this.handleAuthSuccess(response))
        );
    }

    /**
     * Logout user
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.EMAIL_KEY);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Get stored user email
     */
    getUserEmail(): string | null {
        return localStorage.getItem(this.EMAIL_KEY);
    }

    /**
     * Check if user has a token
     */
    hasToken(): boolean {
        return !!this.getToken();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.hasToken();
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.EMAIL_KEY, response.email);
        this.isAuthenticatedSubject.next(true);
    }
}

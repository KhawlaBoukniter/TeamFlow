import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh-token')) {
                return handle401Error(req, next, authService);
            }

            if (error.status === 401 && req.url.includes('/auth/refresh-token')) {
                authService.clearSession();
            }

            return throwError(() => error);
        })
    );
};

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
    if ((authService as any).isRefreshingSubject.value) {
        return authService.refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => {
                return next(addTokenToRequest(request, token!));
            })
        );
    }

    (authService as any).isRefreshingSubject.next(true);
    authService.refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (refreshToken) {
        return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
                (authService as any).isRefreshingSubject.next(false);
                authService.refreshTokenSubject.next(response.token);
                return next(addTokenToRequest(request, response.token));
            }),
            catchError((err) => {
                (authService as any).isRefreshingSubject.next(false);
                authService.clearSession();
                return throwError(() => err);
            })
        );
    } else {
        authService.clearSession();
        return throwError(() => new Error('No refresh token available'));
    }
}

function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}

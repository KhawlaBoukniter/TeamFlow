import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expired or invalid
                authService.logout(); // Clears storage and redirects
            } else if (error.status === 403) {
                // Forbidden
                // Optional: Navigate to a forbidden page or show specific message
                // For now, staying on same page but error will be caught by GlobalErrorHandler
            }

            // Re-throw to be handled by GlobalErrorHandler or component specific catch
            return throwError(() => error);
        })
    );
};

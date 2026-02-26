import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    }

    // If authenticated but not admin, redirect to dashboard
    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }

    // Not authenticated, redirect to login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

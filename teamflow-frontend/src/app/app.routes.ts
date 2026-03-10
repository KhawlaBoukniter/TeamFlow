import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'projects',
                loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent)
            },
            {
                path: 'projects/:id/board',
                loadComponent: () => import('./features/projects/board-page/board-page.component').then(m => m.BoardPageComponent)
            },
            {
                path: 'inbox',
                loadComponent: () => import('./features/inbox/inbox.component').then(m => m.InboxComponent)
            },
            {
                path: 'my-issues',
                loadComponent: () => import('./features/my-issues/my-issues.component').then(m => m.MyIssuesComponent)
            },
            {
                path: 'admin/audit',
                canActivate: [adminGuard],
                loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent)
            },
            {
                path: 'admin/users',
                canActivate: [adminGuard],
                loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatChipsModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './user-management.component.html',
    styles: [`
        .user-mgmt-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .header-section {
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .user-table {
            width: 100%;
            background: #1C1C1E !important;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #2E3035;
        }
        ::ng-deep .user-table .mat-mdc-header-cell {
            background: #25262B !important;
            color: #8A8F98 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #2E3035 !important;
        }
        ::ng-deep .user-table .mat-mdc-cell {
            color: #E4E4E7 !important;
            border-bottom: 1px solid #2E3035 !important;
        }
        ::ng-deep .user-table .mat-mdc-row:hover {
            background: #25262B !important;
        }
        .status-chip {
            font-size: 0.7rem;
            height: 24px;
        }
        .admin-chip {
            background-color: rgba(94, 106, 210, 0.2) !important;
            color: #5E6AD2 !important;
        }
    `]
})
export class UserManagementComponent implements OnInit {
    users: User[] = [];
    loading = true;
    displayedColumns: string[] = ['fullName', 'email', 'role', 'status', 'lastLogin', 'actions'];

    private userService = inject(UserService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.userService.getAllUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching users', err);
                this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    toggleActive(user: User): void {
        if (user.id === this.authService.getCurrentUserId()) {
            this.snackBar.open('You cannot deactivate your own account', 'Close', { duration: 3000 });
            return;
        }

        this.userService.toggleActive(user.id).subscribe({
            next: (updatedUser) => {
                this.loadUsers();
                this.snackBar.open(`User ${updatedUser.isActive ? 'activated' : 'deactivated'}`, 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Error toggling active status', err);
                this.snackBar.open('Action failed', 'Close', { duration: 3000 });
            }
        });
    }

    toggleAdmin(user: User): void {
        if (user.id === this.authService.getCurrentUserId()) {
            this.snackBar.open('You cannot change your own admin status', 'Close', { duration: 3000 });
            return;
        }

        const newAdminStatus = !user.isAdmin;
        this.userService.updateUser(user.id, { isAdmin: newAdminStatus }).subscribe({
            next: (updatedUser) => {
                this.loadUsers();
                this.snackBar.open(`User role updated`, 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Error updating role', err);
                this.snackBar.open('Failed to update role', 'Close', { duration: 3000 });
            }
        });
    }

    deleteUser(user: User): void {
        if (user.id === this.authService.getCurrentUserId()) {
            this.snackBar.open('You cannot delete yourself', 'Close', { duration: 3000 });
            return;
        }

        if (confirm(`Are you sure you want to delete ${user.fullName}? This is a soft delete.`)) {
            this.userService.deleteUser(user.id).subscribe({
                next: () => {
                    this.loadUsers();
                    this.snackBar.open('User deleted', 'Close', { duration: 2000 });
                },
                error: (err) => {
                    console.error('Error deleting user', err);
                    this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
                }
            });
        }
    }
}

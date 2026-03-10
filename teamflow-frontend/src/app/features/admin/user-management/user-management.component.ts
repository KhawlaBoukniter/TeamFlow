import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
        MatProgressSpinnerModule,
        MatPaginatorModule
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
            border-radius: 12px 12px 0 0;
            overflow: hidden;
            border: 1px solid #2E3035;
            border-bottom: none;
        }
        ::ng-deep .mat-mdc-paginator {
            background: #1C1C1E !important;
            color: #8A8F98 !important;
            border: 1px solid #2E3035;
            border-top: 1px solid #2E3035;
            border-radius: 0 0 12px 12px;
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
    users = new MatTableDataSource<User>([]);
    loading = true;
    displayedColumns: string[] = ['fullName', 'email', 'role', 'status', 'lastLogin', 'actions'];

    totalElements = 0;
    pageSize = 20;
    pageIndex = 0;

    get totalUsers(): number {
        return this.totalElements;
    }

    get adminCount(): number {
        return this.users.data.filter(u => u.isAdmin).length;
    }

    get activeCount(): number {
        return this.users.data.filter(u => u.isActive).length;
    }

    private userService = inject(UserService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(page: number = this.pageIndex, size: number = this.pageSize): void {
        this.loading = true;
        this.userService.getAllUsers(page, size).subscribe({
            next: (response) => {
                this.users.data = response.content;
                this.totalElements = response.totalElements;
                this.pageIndex = response.number;
                this.pageSize = response.size;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching users', err);
                this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadUsers(this.pageIndex, this.pageSize);
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

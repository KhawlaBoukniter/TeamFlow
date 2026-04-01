
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatSnackBarModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    activeTab: 'info' | 'password' = 'info';
    user: User | null = null;
    loading = false;

    infoForm: FormGroup;
    passwordForm: FormGroup;

    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);
    private fb = inject(FormBuilder);

    constructor() {
        this.infoForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(3)]]
        });

        this.passwordForm = this.fb.group({
            oldPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.userService.getProfile().subscribe({
            next: (user) => {
                this.user = user;
                this.infoForm.patchValue({ fullName: user.fullName });
            },
            error: () => this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 })
        });
    }

    updateProfile() {
        if (this.infoForm.invalid) return;
        this.loading = true;
        this.userService.updateProfile(this.infoForm.value).subscribe({
            next: (updated) => {
                this.user = updated;
                this.loading = false;
                this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
            },
            error: () => {
                this.loading = false;
                this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
            }
        });
    }

    changePassword() {
        if (this.passwordForm.invalid) return;
        this.loading = true;
        this.userService.changePassword(this.passwordForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.passwordForm.reset();
                this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
                this.loading = false;
                this.snackBar.open(err.error?.message || 'Failed to change password', 'Close', { duration: 3000 });
            }
        });
    }

    private passwordMatchValidator(group: FormGroup) {
        const pass = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return pass === confirm ? null : { mismatch: true };
    }
}

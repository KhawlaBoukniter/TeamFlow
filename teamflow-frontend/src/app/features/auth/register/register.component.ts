import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../shared/models';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './register.component.html'
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);

    registerForm: FormGroup;
    loading = false;
    errorMessage = '';
    hidePassword = true;
    hideConfirmPassword = true;

    constructor() {
        this.registerForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        return null;
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const { confirmPassword, ...registerRequest } = this.registerForm.value;
        const request: RegisterRequest = registerRequest;

        this.authService.register(request).subscribe({
            next: () => {
                this.loading = false;
                this.snackBar.open('Registration successful! Please login.', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom'
                });
                this.router.navigate(['/login']);
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
                console.error('Registration error:', error);
            }
        });
    }

    togglePasswordVisibility(): void {
        this.hidePassword = !this.hidePassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.hideConfirmPassword = !this.hideConfirmPassword;
    }
}

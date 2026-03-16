
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
    template: `
    <div class="p-8 max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p class="text-[#8A8F98]">Manage your personal information and security preferences.</p>
      </header>

      <!-- Tabs Navigation -->
      <div class="flex gap-8 border-b border-[#1C1C1E] mb-8">
        <button (click)="activeTab = 'info'" 
                [class.text-brand]="activeTab === 'info'"
                [class.border-brand]="activeTab === 'info'"
                class="pb-4 px-1 text-sm font-medium border-b-2 border-transparent transition-all">
          Personal Info
        </button>
        <button (click)="activeTab = 'password'" 
                [class.text-brand]="activeTab === 'password'"
                [class.border-brand]="activeTab === 'password'"
                class="pb-4 px-1 text-sm font-medium border-b-2 border-transparent transition-all">
          Password & Security
        </button>
      </div>

      <!-- Tab Content: Personal Info -->
      <div *ngIf="activeTab === 'info'" class="animate-fadeIn">
        <form [formGroup]="infoForm" (ngSubmit)="updateProfile()" class="space-y-6 max-w-xl">
          <div class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">Full Name</label>
            <input formControlName="fullName"
                   class="w-full bg-[#1C1C1E] border border-[#2E3035] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition-colors"
                   placeholder="Enter your full name">
          </div>
          
          <div class="space-y-2 opacity-60">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">Email Address</label>
            <input [value]="user?.email" disabled
                   class="w-full bg-[#121214] border border-[#2E3035] rounded-lg px-4 py-2.5 text-[#8A8F98] cursor-not-allowed">
            <p class="text-[10px] text-[#8A8F98]">Email cannot be changed currently.</p>
          </div>

          <div class="pt-4">
            <button mat-flat-button color="primary" type="submit" [disabled]="infoForm.invalid || loading"
                    class="!bg-[#5E6AD2] !text-white !rounded-md !px-6 !h-10 font-medium">
              {{ loading ? 'Updating...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Tab Content: Password -->
      <div *ngIf="activeTab === 'password'" class="animate-fadeIn">
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="space-y-6 max-w-xl">
          <div class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">Current Password</label>
            <input type="password" formControlName="oldPassword"
                   class="w-full bg-[#1C1C1E] border border-[#2E3035] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition-colors"
                   placeholder="••••••••">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">New Password</label>
              <input type="password" formControlName="newPassword"
                     class="w-full bg-[#1C1C1E] border border-[#2E3035] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition-colors"
                     placeholder="••••••••">
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">Confirm New Password</label>
              <input type="password" formControlName="confirmPassword"
                     class="w-full bg-[#1C1C1E] border border-[#2E3035] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition-colors"
                     placeholder="••••••••">
            </div>
          </div>

          <div class="pt-4">
            <button mat-flat-button color="primary" type="submit" [disabled]="passwordForm.invalid || loading"
                    class="!bg-[#5E6AD2] !text-white !rounded-md !px-6 !h-10 font-medium">
              {{ loading ? 'Updating Password...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `]
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

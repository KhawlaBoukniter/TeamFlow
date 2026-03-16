import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommandPaletteComponent } from '../../../shared/components/command-palette/command-palette.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { BRANDING } from '../../constants/branding';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="flex flex-col h-full bg-[#121214] text-[#8A8F98] border-r border-[#1C1C1E] select-none">
      
      <!-- Logo Section -->
      <div class="px-6 py-10 justify-items-center">
        <img src="assets/images/logo.png" alt="TeamFlow" class="h-8 w-auto grayscale brightness-200 opacity-80">
      </div>

      <!-- Top: Workspace Selector -->
      <div class="h-12 flex items-center px-4 hover:bg-[#1C1C1E] cursor-pointer transition-colors mx-2 mt-2 rounded-lg group">
        <div class="w-5 h-5 rounded bg-brand flex items-center justify-center text-[10px] text-white font-bold mr-2 shadow-sm shrink-0">
          {{ workspaceName.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 text-[13px] font-semibold text-white truncate">
          {{ workspaceName }}
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <mat-icon class="!w-4 !h-4 !text-[16px]">unfold_more</mat-icon>
        </div>
      </div>

      <!-- Search Trigger -->
      <div (click)="openSearch()" 
           class="mx-4 mt-4 h-9 flex items-center px-3 bg-[#1C1C1E] border border-[#2E3035] rounded-md cursor-pointer hover:border-[#3A3C42] transition-colors group">
        <mat-icon class="!w-4 !h-4 !text-[14px] text-[#8A8F98] mr-2">search</mat-icon>
        <span class="text-[12px] text-[#8A8F98] flex-1">Search...</span>
        <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#25262B] text-[10px] text-[#8A8F98] font-mono group-hover:text-white transition-colors">
          <span>Ctrl</span>
          <span>K</span>
        </div>
      </div>

      <!-- Scrollable Nav -->
      <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto mt-3">

        <!-- Primary Items -->
        <a routerLink="/dashboard"
           routerLinkActive="!bg-[#25262B] !text-white font-medium"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
          <mat-icon class="!w-4 !h-4 !text-[16px]">space_dashboard</mat-icon>
          <span class="text-[13px]">Dashboard</span>
        </a>
        <a routerLink="/inbox"
           routerLinkActive="!bg-[#25262B] !text-white font-medium"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98] relative group">
          <mat-icon class="!w-4 !h-4 !text-[16px]">inbox</mat-icon>
          <span class="text-[13px] flex-1">Inbox</span>
          <span *ngIf="(unreadCount$ | async) || 0 > 0"
                class="min-w-[16px] h-4 px-1 bg-[#5E6AD2] text-white text-[9px] font-bold flex items-center justify-center rounded-sm">
            {{ unreadCount$ | async }}
          </span>
        </a>
        <a routerLink="/profile"
           routerLinkActive="!bg-[#25262B] !text-white font-medium"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
          <mat-icon class="!w-4 !h-4 !text-[16px]">settings</mat-icon>
          <span class="text-[13px]">Profile Settings</span>
        </a>

        <!-- Workspace Section -->
        <div class="pt-4 pb-1.5 px-2">
          <span class="text-[10px] font-semibold uppercase tracking-widest text-[#8A8F98]/50">Workspace</span>
        </div>

        <a routerLink="/my-issues"
           routerLinkActive="!bg-[#25262B] !text-white font-medium"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
          <mat-icon class="!w-4 !h-4 !text-[16px]">adjust</mat-icon>
          <span class="text-[13px]">My issues</span>
        </a>

        <a routerLink="/projects"
           routerLinkActive="!bg-[#25262B] !text-white font-medium"
           [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
          <mat-icon class="!w-4 !h-4 !text-[16px]">dns</mat-icon>
          <span class="text-[13px]">Projects</span>
        </a>

        <!-- Admin Section -->
        <ng-container *ngIf="authService.isAdmin()">
          <div class="pt-4 pb-1.5 px-2">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-[#8A8F98]/50">Administration</span>
          </div>
          <a routerLink="/admin/users"
             routerLinkActive="!bg-[#25262B] !text-white font-medium"
             class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
            <mat-icon class="!w-4 !h-4 !text-[16px]">people</mat-icon>
            <span class="text-[13px]">User Management</span>
          </a>
          <a routerLink="/admin/audit"
             routerLinkActive="!bg-[#25262B] !text-white font-medium"
             class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C1C1E] hover:text-white transition-colors cursor-pointer text-[#8A8F98]">
            <mat-icon class="!w-4 !h-4 !text-[16px]">history</mat-icon>
            <span class="text-[13px]">Audit Log</span>
          </a>
        </ng-container>
      </nav>

      <!-- Bottom Actions -->
      <div class="p-3 mt-auto space-y-0.5 border-t border-[#1C1C1E]">

        <!-- User / Logout -->
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-[#1C1C1E] px-2">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] flex items-center justify-center text-white font-semibold shrink-0">
              {{ userEmail.charAt(0).toUpperCase() }}
            </div>
            <span class="text-[12px] truncate text-[#8A8F98]">{{ userEmail }}</span>
          </div>
          <button mat-icon-button class="!w-6 !h-6 shrink-0" (click)="logout()" matTooltip="Logout">
            <mat-icon class="!text-[14px] text-[#8A8F98] hover:text-white">logout</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class SidebarComponent {
  readonly BRANDING = BRANDING;
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  private dialog = inject(MatDialog);

  unreadCount$ = this.notificationService.unreadCount$;

  ngOnInit() {
    this.notificationService.refreshUnreadCount();
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'User';
  }

  get workspaceName(): string {
    // Mock workspace name derived from email or static
    const email = this.userEmail;
    return (email.split('@')[0] || 'My Workspace') + "'s Team";
  }

  logout(): void {
    this.authService.logout();
  }

  openSearch() {
    this.dialog.open(CommandPaletteComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'command-palette-dialog',
      backdropClass: 'command-palette-backdrop'
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { BRANDING } from '../../constants/branding';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="flex flex-col h-full bg-linear-sidebar text-linear-text-secondary border-r border-linear-border select-none">
      <!-- Top: Workspace Selector -->
      <div class="h-12 flex items-center px-4 hover:bg-linear-hover cursor-pointer transition-colors m-2 rounded-lg group">
        <div class="w-5 h-5 rounded bg-brand-500 flex items-center justify-center text-[10px] items-center text-white font-bold mr-2 shadow-sm">
            {{ workspaceName.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 text-[13px] font-medium text-linear-text-primary truncate">
            {{ workspaceName }}
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <mat-icon class="!w-4 !h-4 !text-[16px] text-linear-text-secondary">search</mat-icon>
             <mat-icon class="!w-4 !h-4 !text-[16px] text-linear-text-secondary">edit_note</mat-icon>
        </div>
      </div>

      <!-- Scrollable Nav -->
      <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
        
        <!-- Primary Items -->
        <a routerLink="/inbox"
           routerLinkActive="bg-linear-hover text-linear-text-primary"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer group">
            <mat-icon class="!w-4 !h-4 !text-[16px]">inbox</mat-icon>
            <span class="text-[13px]">Inbox</span>
        </a>
        <a routerLink="/my-issues"
           routerLinkActive="bg-linear-hover text-linear-text-primary"
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer group">
            <mat-icon class="!w-4 !h-4 !text-[16px]">adjust</mat-icon>
            <span class="text-[13px]">My issues</span>
        </a>

        <!-- Workspace Section -->
        <div class="pt-4 pb-2 px-2 flex items-center justify-between group cursor-pointer">
            <span class="text-[11px] font-medium text-linear-text-secondary/70 hover:text-linear-text-secondary transition-colors">Workspace</span>
             <mat-icon class="!w-3 !h-3 !text-[12px] opacity-0 group-hover:opacity-100">add</mat-icon>
        </div>

        <a routerLink="/projects" 
           routerLinkActive="bg-linear-hover text-linear-text-primary" 
           class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">dns</mat-icon>
            <span class="text-[13px]">Projects</span>
        </a>
        <a class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer">
            <mat-icon class="!w-4 !h-4 !text-[16px]">layers</mat-icon>
            <span class="text-[13px]">Views</span>
        </a>

        <!-- Teams Section -->
        <div class="pt-4 pb-2 px-2">
            <span class="text-[11px] font-medium text-linear-text-secondary/70">Your teams</span>
        </div>
        <a class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer">
             <div class="w-4 h-4 rounded bg-green-600 flex items-center justify-center text-[9px] text-white font-bold">
                {{ userEmail.charAt(0).toUpperCase() }}
             </div>
             <span class="text-[13px]">{{ userEmail.split('@')[0] }}</span>
             <mat-icon class="!w-3 !h-3 !text-[12px] ml-auto opacity-50">arrow_drop_down</mat-icon>
        </a>
      </nav>

      <!-- Bottom Actions -->
      <div class="p-3 mt-auto space-y-0.5 border-t border-linear-border/30">
          <a class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer text-linear-text-secondary">
            <mat-icon class="!w-4 !h-4 !text-[16px]">cloud_upload</mat-icon>
            <span class="text-[13px]">Import issues</span>
          </a>
          <a class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-linear-hover hover:text-linear-text-primary transition-colors cursor-pointer text-linear-text-secondary">
            <mat-icon class="!w-4 !h-4 !text-[16px]">person_add</mat-icon>
            <span class="text-[13px]">Invite people</span>
          </a>
          
          <!-- User/Logout -->
           <div class="flex items-center justify-between mt-2 pt-2 border-t border-linear-border/30 px-2">
                <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] flex items-center justify-center text-white">
                        {{ userEmail.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-[12px] truncate max-w-[100px]">{{ userEmail }}</span>
                </div>
                <button mat-icon-button class="!w-6 !h-6" (click)="logout()" matTooltip="Logout">
                    <mat-icon class="!text-[14px]">logout</mat-icon>
                </button>
           </div>
      </div>
    </div>
  `
})
export class SidebarComponent {
  readonly BRANDING = BRANDING;
  authService = inject(AuthService);
  router = inject(Router);

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
}

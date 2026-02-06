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
    <div class="flex flex-col h-full bg-[#1e293b] text-slate-300">
      <!-- Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-indigo-500/10 shrink-0 bg-[#0f172a]" routerLink="/projects">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 shadow-sm overflow-hidden">
             <img [src]="BRANDING.LOGO_PATH" [alt]="BRANDING.APP_NAME" class="w-6 h-6 object-contain opacity-90">
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <!-- Main Section -->
        <h3 class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Workspace</h3>
        
        <a routerLink="/projects" 
           routerLinkActive="bg-white/10 text-white shadow-sm" 
           [routerLinkActiveOptions]="{exact: false}"
           class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 group">
          <mat-icon class="text-xl text-slate-400 group-hover:text-white transition-colors">dashboard</mat-icon>
          <span class="text-sm font-medium">Projects</span>
        </a>

        <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 group opacity-50 cursor-not-allowed" 
           title="Coming soon">
          <mat-icon class="text-xl text-slate-400 group-hover:text-white transition-colors">check_circle</mat-icon>
          <span class="text-sm font-medium">My Tasks</span>
        </a>

        <!-- Collaboration Section -->
        <h3 class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Collaboration</h3>
        
        <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 group opacity-50 cursor-not-allowed">
            <mat-icon class="text-xl text-slate-400 group-hover:text-white transition-colors">chat</mat-icon>
            <span class="text-sm font-medium">Messages</span>
        </a>
        
        <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 group opacity-50 cursor-not-allowed">
            <mat-icon class="text-xl text-slate-400 group-hover:text-white transition-colors">group</mat-icon>
            <span class="text-sm font-medium">Team</span>
        </a>
      </nav>

      <!-- User Profile (Bottom) -->
      <div class="p-4 border-t border-white/10 shrink-0">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                    {{ (userEmail | slice:0:1) || 'U' }}
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-medium text-white truncate w-24">{{ userEmail }}</span>
                    <span class="text-xs text-slate-500">Online</span>
                </div>
            </div>
            
            <button mat-icon-button (click)="logout()" class="text-slate-400 hover:text-white" matTooltip="Logout">
                <mat-icon class="text-lg">logout</mat-icon>
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

  logout(): void {
    this.authService.logout();
  }
}

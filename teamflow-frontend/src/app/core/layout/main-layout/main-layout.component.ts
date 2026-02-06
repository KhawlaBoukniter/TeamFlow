import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, MatIconModule, MatButtonModule],
  template: `
    <div class="flex h-screen w-full bg-linear-bg text-linear-text-primary font-sans selection:bg-brand-500/30">
      <!-- Sidebar (Fixed width) -->
      <app-sidebar class="w-[240px] shrink-0 h-full border-r border-linear-border z-20"></app-sidebar>
      
      <!-- Main Content Area -->
      <main class="flex-1 h-full overflow-hidden flex flex-col relative">
        <!-- Global Header (Linear Style) -->
        <header class="h-12 shrink-0 flex items-center justify-between px-5 border-b border-linear-border">
            <!-- Left: Breadcrumbs -->
            <div class="flex items-center gap-2 text-[13px] text-linear-text-secondary">
                <span class="hover:text-linear-text-primary cursor-pointer transition-colors">Projects</span>
                <span class="text-linear-border">/</span>
                <span class="text-linear-text-primary font-medium flex items-center gap-2">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">dns</mat-icon>
                    All projects
                </span>
                <span class="px-1.5 py-0.5 rounded text-[10px] bg-linear-border/50 text-linear-text-secondary ml-2">New view</span>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-1">
                <button mat-icon-button class="!w-8 !h-8 text-linear-text-secondary hover:text-linear-text-primary">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">link</mat-icon>
                </button>
                <div class="h-4 w-[1px] bg-linear-border mx-1"></div>
                <!-- Add Project -->
                <button class="h-7 px-3 flex items-center gap-1.5 bg-linear-hover hover:bg-white/10 rounded text-[13px] text-linear-text-primary transition-colors border border-white/5">
                    <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">add</mat-icon>
                    Add project
                </button>
                <button mat-icon-button class="!w-8 !h-8 text-linear-text-secondary hover:text-linear-text-primary ml-1">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">view_sidebar</mat-icon>
                </button>
            </div>
        </header>

        <!-- Filter Bar (Optional, static for now matching image) -->
        <div class="h-10 shrink-0 flex items-center px-5 border-b border-linear-border gap-4">
            <div class="flex items-center gap-2 text-[13px] text-linear-text-secondary hover:text-linear-text-primary cursor-pointer">
                <mat-icon class="!w-4 !h-4 !text-[16px]">filter_list</mat-icon>
                <span>Filter</span>
            </div>
            <div class="flex-1"></div>
            <button class="flex items-center gap-1.5 text-[12px] text-linear-text-secondary hover:text-linear-text-primary bg-linear-hover px-2 py-1 rounded border border-white/5">
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">tune</mat-icon>
                Display
            </button>
        </div>

        <!-- Router Content -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-linear-border scrollbar-track-transparent">
            <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class MainLayoutComponent { }

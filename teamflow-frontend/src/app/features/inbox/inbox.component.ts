import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-inbox',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule],
    template: `
    <div class="h-full flex flex-col bg-[#09090b] page-enter">
      <!-- Header -->
      <div class="h-14 border-b border-[#2E3035] px-6 flex items-center gap-3">
        <mat-icon class="text-[#8A8F98] !text-[20px]">inbox</mat-icon>
        <h1 class="text-base font-semibold text-white">Inbox</h1>
      </div>

      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div class="w-20 h-20 rounded-2xl bg-[#1C1C1E] border border-[#2E3035] flex items-center justify-center mb-6">
          <mat-icon class="!text-[36px] !w-9 !h-9 text-[#3A3C42]">inbox</mat-icon>
        </div>
        <h2 class="text-lg font-semibold text-white mb-2">No new notifications</h2>
        <p class="text-sm text-[#8A8F98] max-w-xs">
          You're all caught up! Notifications about your projects and tasks will appear here.
        </p>
        <div class="mt-6 px-4 py-2 rounded-lg bg-[#1C1C1E] border border-[#2E3035] text-xs text-[#8A8F98]">
          🚀 Coming soon — real-time notifications
        </div>
      </div>
    </div>
  `
})
export class InboxComponent { }

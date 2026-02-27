import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../shared/models';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="h-full flex flex-col bg-[#09090b] text-white overflow-hidden page-enter">
      
      <!-- HEADER -->
      <div class="h-14 border-b border-[#1C1C1E] px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <h1 class="text-[14px] font-semibold text-[#EDEDED]">Inbox</h1>
        </div>
        
        <div class="flex items-center gap-2">
          <button *ngIf="notifications.length > 0" 
                  (click)="markAllAsRead()"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-[#8A8F98] hover:text-white hover:bg-[#1C1C1E] rounded-md transition-all">
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">done_all</mat-icon>
            Mark all read
          </button>
          <div class="w-[1px] h-4 bg-[#1C1C1E] mx-1"></div>
          <button class="p-1.5 text-[#8A8F98] hover:text-white rounded-md hover:bg-[#1C1C1E]">
            <mat-icon class="!w-4 !h-4 !text-[16px]">filter_list</mat-icon>
          </button>
          <button class="p-1.5 text-[#8A8F98] hover:text-white rounded-md hover:bg-[#1C1C1E]">
            <mat-icon class="!w-4 !h-4 !text-[16px]">settings</mat-icon>
          </button>
        </div>
      </div>

      <!-- CONTENT AREA -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        
        <!-- EMPTY STATE (Matching Screenshot) -->
        <div *ngIf="notifications.length === 0" class="h-full flex flex-col items-center justify-center p-10 animate-fade-in">
          <div class="relative mb-6">
             <!-- Custom tray icon SVG attempt or using mat-icon with styling -->
             <div class="w-24 h-24 flex items-center justify-center border-2 border-[#1C1C1E] rounded-[28px] bg-[#09090b]">
                <mat-icon class="!w-12 !h-12 !text-[48px] text-[#2E3035] opacity-50">shopping_basket</mat-icon>
             </div>
          </div>
          <h2 class="text-[15px] font-medium text-[#EDEDED] mb-1">No notifications</h2>
          <p class="text-[13px] text-[#8A8F98]">You're all caught up.</p>
        </div>

        <!-- NOTIFICATIONS LIST -->
        <div *ngIf="notifications.length > 0" class="divide-y divide-[#1C1C1E]">
          <div *ngFor="let notif of notifications" 
               (click)="onNotificationClick(notif)"
               class="group relative flex items-start gap-4 px-6 py-4 hover:bg-[#111113] transition-colors cursor-pointer border-l-2 border-transparent"
               [class.border-l-[#5E6AD2]]="!notif.isRead">
            
            <!-- Type Icon -->
            <div class="mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                 [ngClass]="{
                   'bg-blue-500/10 text-blue-400': notif.type === 'TASK_ASSIGNED',
                   'bg-purple-500/10 text-purple-400': notif.type === 'COMMENT_ADDED',
                   'bg-emerald-500/10 text-emerald-400': notif.type === 'TASK_MOVED',
                   'bg-[#1C1C1E] text-[#8A8F98]': notif.isRead
                 }">
              <mat-icon class="!w-4 !h-4 !text-[18px]">
                {{ getIconForType(notif.type) }}
              </mat-icon>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0 flex flex-col gap-0.5">
              <div class="flex items-center justify-between gap-4">
                <span class="text-[13px] font-semibold" [class.text-white]="!notif.isRead" [class.text-[#8A8F98]]="notif.isRead">
                  {{ notif.type.replace('_', ' ') }}
                </span>
                <span class="text-[11px] text-[#3A3C42] whitespace-nowrap">
                  {{ notif.createdAt | date:'MMM d, HH:mm' }}
                </span>
              </div>
              <p class="text-[13px] leading-relaxed line-clamp-2" [class.text-[#EDEDED]]="!notif.isRead" [class.text-[#8A8F98]]="notif.isRead">
                {{ notif.message }}
              </p>
            </div>

            <!-- Actions (appear on hover) -->
            <div class="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111113] pl-4">
               <button mat-icon-button (click)="$event.stopPropagation(); markAsRead(notif)" 
                       class="!w-8 !h-8" matTooltip="Mark as read" *ngIf="!notif.isRead">
                 <mat-icon class="!text-[16px] text-[#8A8F98] hover:text-white">done</mat-icon>
               </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InboxComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notifications: Notification[] = [];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getRecent(30).subscribe(data => {
      this.notifications = data;
    });
    this.notificationService.refreshUnreadCount();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.notificationService.refreshUnreadCount();
    });
  }

  markAsRead(notif: Notification): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        notif.isRead = true;
        this.notificationService.refreshUnreadCount();
      });
    }
  }

  onNotificationClick(notif: Notification): void {
    this.markAsRead(notif);
    // Future: navigate to task/comment
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'TASK_ASSIGNED': return 'person_add';
      case 'COMMENT_ADDED': return 'chat_bubble';
      case 'TASK_MOVED': return 'low_priority';
      case 'PROJECT_INVITE': return 'mail';
      default: return 'notifications';
    }
  }
}

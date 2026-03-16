import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../core/services/notification.service';
import { TaskService } from '../../core/services/task.service';
import { Notification } from '../../shared/models';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="h-full w-full flex flex-row bg-[#09090b] text-[#EDEDED] overflow-hidden page-enter font-sans">
      
      <!-- MASTER: LEFT SIDEBAR LIST -->
      <div class="w-[380px] border-r border-[#1C1C1E] flex flex-col shrink-0 bg-[#0c0c0e] z-10 shadow-2xl">
        
        <!-- HEADER -->
        <div class="h-14 border-b border-[#1C1C1E] px-4 flex items-center justify-between shrink-0 bg-[#0c0c0e]">
           <div class="flex items-center gap-2">
             <div class="w-6 h-6 rounded-lg bg-[#1C1C1E] flex items-center justify-center border border-[#2E3035]">
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px] text-[#5E6AD2]">inbox</mat-icon>
             </div>
             <h1 class="text-[13px] font-bold text-[#EDEDED] tracking-tight">Inbox</h1>
           </div>
           
           <div class="flex items-center gap-1">
             <button (click)="markAllAsRead()"
                     *ngIf="notifications.length > 0"
                     class="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#8A8F98] hover:text-white rounded-md hover:bg-[#1C1C1E] transition-all border border-transparent hover:border-[#2E3035]"
                     matTooltip="Archive all read">
               Mark all Read
             </button>
           </div>
        </div>

        <!-- LIST AREA -->
        <div class="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e]">
          <div *ngIf="notifications.length === 0" class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div class="p-6 rounded-3xl bg-[#1C1C1E]/50 mb-4 border border-[#1C1C1E] shadow-2xl">
                <mat-icon class="!w-8 !h-8 !text-[32px] text-[#3A3C42]">inbox</mat-icon>
             </div>
             <p class="text-[13px] font-semibold text-[#8A8F98]">No notifications</p>
             <p class="text-[11px] text-[#3A3C42] mt-1">You're all caught up!</p>
          </div>

          <div *ngIf="notifications.length > 0" class="divide-y divide-[#1C1C1E]/30">
            <div *ngFor="let notif of notifications" 
                 (click)="selectNotification(notif)"
                 class="group relative flex flex-col gap-1.5 px-5 py-5 cursor-pointer transition-all border-l-2 border-transparent"
                 [class.bg-[#1C1C1E]/50]="selectedNotification?.id === notif.id"
                 [class.hover:bg-[#1C1C1E]/20]="selectedNotification?.id !== notif.id"
                 [class.!border-l-[#5E6AD2]]="!notif.isRead">
              
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 overflow-hidden">
                  <span class="text-[10px] font-black tracking-widest uppercase opacity-40" [class.!opacity-100]="!notif.isRead">
                    {{ notif.type.replace('_', ' ') }}
                  </span>
                </div>
                <span class="text-[10px] text-[#3A3C42] font-semibold whitespace-nowrap">
                  {{ notif.createdAt | date:'HH:mm' }}
                </span>
              </div>
              
              <p class="text-[13px] line-clamp-2 leading-[1.6] tracking-tight" 
                 [class.text-[#EDEDED]]="!notif.isRead" 
                 [class.text-[#8A8F98]]="notif.isRead"
                 [class.font-semibold]="!notif.isRead">
                {{ notif.message }}
              </p>

              <div class="flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                 <span class="px-2 py-0.5 rounded-lg bg-[#1C1C1E] text-[10px] text-[#5E6AD2] font-bold border border-[#2E3035]">
                   {{ notif.entityType }} #{{ notif.entityId }}
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DETAIL: RIGHT CONTENT -->
      <div class="flex-1 flex flex-col bg-[#09090b] shadow-[inner_0_0_100px_rgba(0,0,0,0.5)]">
        
        <!-- DETAIL HEADER -->
        <div class="h-14 border-b border-[#1C1C1E] px-8 flex items-center justify-between shrink-0 bg-[#09090b]/80 backdrop-blur-md">
          <div *ngIf="selectedNotification" class="flex items-center gap-3">
            <span class="text-[11px] font-black text-[#8A8F98] uppercase tracking-[0.3em]">
              Contextual Details
            </span>
          </div>
          <div class="flex items-center gap-2" *ngIf="selectedNotification">
          </div>
        </div>

        <!-- DETAIL BODY -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-12 flex flex-col items-center">
          
          <!-- EMPTY SELECTION STATE -->
          <div *ngIf="!selectedNotification" class="h-full flex flex-col items-center justify-center animate-fade-in max-w-[400px] text-center">
            <div class="relative mb-8">
               <div class="absolute inset-0 bg-[#5E6AD2] blur-[80px] opacity-10"></div>
               <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative">
                 <rect x="3" y="4" width="18" height="16" rx="3" stroke="#1C1C1E" stroke-width="1.5"/>
                 <path d="M7 8H17M7 12H13" stroke="#3A3C42" stroke-width="1.5" stroke-linecap="round"/>
               </svg>
            </div>
            <h2 class="text-[17px] font-bold text-[#EDEDED] mb-3 tracking-tight">Focus on what matters</h2>
            <p class="text-[13px] text-[#8A8F98] leading-relaxed">Select a notification to view its context and take quick actions.</p>
          </div>

          <!-- NOTIFICATION DETAIL -->
          <div *ngIf="selectedNotification" class="w-full max-w-[640px] animate-slide-up">
            <div class="flex items-start justify-between mb-8">
               <div class="flex items-center gap-4">
                 <div class="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#1C1C1E] shadow-xl"
                      [ngClass]="{
                        'bg-blue-500/10 text-blue-400 border-blue-500/20': selectedNotification.type === 'TASK_ASSIGNED',
                        'bg-purple-500/10 text-purple-400 border-purple-500/20': selectedNotification.type === 'COMMENT_ADDED',
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': selectedNotification.type === 'TASK_MOVED',
                        'bg-red-500/10 text-red-400 border-red-500/20': selectedNotification.type === 'TASK_BLOCKED',
                        'bg-orange-500/10 text-orange-400 border-orange-500/20': selectedNotification.type === 'ATTACHMENT_ADDED',
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20': selectedNotification.type === 'TASK_UNBLOCKED',
                        'bg-[#1C1C1E] text-[#8A8F98] border-[#2E3035]': selectedNotification.isRead
                      }">
                   <mat-icon class="!w-6 !h-6 !text-[24px]">{{ getIconForType(selectedNotification.type) }}</mat-icon>
                 </div>
                 <div>
                   <h3 class="text-[18px] font-bold tracking-tight mb-0.5">{{ selectedNotification.type.replace('_', ' ') }}</h3>
                   <div class="flex items-center gap-2">
                     <span class="text-[12px] text-[#8A8F98] font-medium">{{ selectedNotification.createdAt | date:'longDate' }}</span>
                     <span class="w-1 h-1 rounded-full bg-[#3A3C42]"></span>
                     <span class="text-[12px] text-[#8A8F98] font-medium">{{ selectedNotification.createdAt | date:'HH:mm' }}</span>
                   </div>
                 </div>
               </div>
               
            </div>

            <div class="bg-gradient-to-b from-[#111113] to-[#09090b] border border-[#1C1C1E] rounded-2xl p-8 mb-10 shadow-2xl relative overflow-hidden group/card">
              <div class="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                 <mat-icon class="!w-24 !h-24 !text-[96px]">{{ getIconForType(selectedNotification.type) }}</mat-icon>
              </div>
              <p class="text-[16px] leading-[1.6] text-[#EDEDED] relative z-10 font-medium tracking-tight">
                {{ selectedNotification.message }}
              </p>
            </div>

            <div class="flex flex-col gap-5">
               <h4 class="text-[11px] font-bold text-[#3A3C42] uppercase tracking-[0.2em]">Quick Actions</h4>
               <div class="grid grid-cols-2 gap-4">
                  <a *ngIf="selectedNotification.projectId"
                     [routerLink]="['/projects', selectedNotification.projectId, 'board']" [queryParams]="{ taskId: selectedNotification.entityId }"
                     class="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] rounded-xl transition-all text-[13px] font-bold border border-[#2E3035] group/btn">
                    <mat-icon class="!w-4 !h-4 !text-[18px] text-[#8A8F98] group-hover/btn:text-white transition-colors">visibility</mat-icon>
                    View Task Context
                  </a>
                  <div *ngIf="!selectedNotification.projectId" 
                       class="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1C1C1E]/50 rounded-xl text-[13px] font-bold border border-[#2E3035] text-[#8A8F98] cursor-wait">
                    <mat-icon class="!w-4 !h-4 !text-[18px] animate-spin">refresh</mat-icon>
                    Refreshing context...
                  </div>
                  <button class="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-transparent hover:bg-[#1C1C1E] rounded-xl transition-all text-[13px] font-bold border border-transparent hover:border-[#2E3035] text-[#8A8F98] hover:text-[#EDEDED]">
                    <mat-icon class="!w-4 !h-4 !text-[18px]">reply</mat-icon>
                    Reply Directly
                  </button>
               </div>
            </div>
            
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-slide-up {
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #1C1C1E;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #2E3035;
    }
  `]
})
export class InboxComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private taskService = inject(TaskService);
  notifications: Notification[] = [];
  selectedNotification: Notification | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getRecent(30).subscribe(data => {
      this.notifications = data;
      if (this.notifications.length > 0 && !this.selectedNotification) {
        const firstUnread = this.notifications.find(n => !n.isRead);
        this.selectedNotification = firstUnread || this.notifications[0];
      }
    });
    this.notificationService.refreshUnreadCount();
  }

  selectNotification(notif: Notification): void {
    this.selectedNotification = notif;
    if (!notif.isRead) {
      this.markAsRead(notif);
    }

    // Repair context if missing
    if (!notif.projectId && notif.entityType === 'TASK') {
      this.taskService.getTaskById(notif.entityId).subscribe({
        next: (task) => {
          if (task.projectId) {
            notif.projectId = task.projectId;
          }
        },
        error: () => console.warn('Could not repair notification context')
      });
    }
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

  getIconForType(type: string): string {
    switch (type) {
      case 'TASK_ASSIGNED': return 'person_add';
      case 'COMMENT_ADDED': return 'chat_bubble';
      case 'TASK_MOVED': return 'auto_awesome_motion';
      case 'PROJECT_INVITE': return 'mail';
      case 'ATTACHMENT_ADDED': return 'attach_file';
      case 'TASK_BLOCKED': return 'lock';
      case 'TASK_UNBLOCKED': return 'lock_open';
      default: return 'notifications';
    }
  }
}

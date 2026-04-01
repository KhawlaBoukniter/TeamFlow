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
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.css'
})
export class InboxComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private taskService = inject(TaskService);
  notifications: Notification[] = [];
  selectedNotification: Notification | null = null;

  ngOnInit(): void {
    this.loadNotifications();

    this.notificationService.notification$.subscribe(notification => {
      this.notifications = [notification, ...this.notifications];
    });
  }

  getActionLabel(notif: Notification): string {
    if (notif.type === 'CHAT_MENTION') return 'Voir message';
    return 'View Task Context';
  }

  getActionLink(notif: Notification): any[] {
    if (!notif.projectId) return [];
    return ['/projects', notif.projectId, 'board'];
  }

  getActionParams(notif: Notification): any {
    if (notif.type === 'CHAT_MENTION') {
      return { messageId: notif.entityId };
    }
    return { taskId: notif.entityId };
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
      case 'CHAT_MENTION': return 'alternate_email';
      default: return 'notifications';
    }
  }
}

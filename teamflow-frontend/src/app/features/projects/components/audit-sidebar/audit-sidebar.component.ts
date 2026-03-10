import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuditLog } from '../../../../shared/models';

@Component({
    selector: 'app-audit-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    template: `
    <div class="audit-panel shadow-2xl" [class.open]="isOpen">
      <div class="audit-header">
        <div class="header-content">
          <div class="header-left">
            <div class="icon-wrapper">
              <mat-icon class="header-icon text-brand">history</mat-icon>
            </div>
            <div class="header-text">
              <h3 class="title">Project Audit Logs</h3>
              <span class="subtitle">Activity History</span>
            </div>
          </div>
          <button mat-icon-button (click)="toggle()" class="close-btn" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="audit-content custom-scrollbar">
        <div *ngIf="loading && logs.length === 0" class="flex flex-col items-center justify-center h-40">
           <div class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3"></div>
           <span class="text-xs text-[#8A8F98]">Loading activities...</span>
        </div>

        <div *ngIf="!loading && logs.length === 0" class="empty-state">
          <mat-icon class="empty-icon">history_toggle_off</mat-icon>
          <p>No activity yet</p>
        </div>

        <div class="log-list" *ngIf="logs.length > 0">
          <div *ngFor="let log of logs" class="log-item group">
            <div class="log-marker" [ngClass]="getMarkerClass(log.action)"></div>
            <div class="log-details">
              <div class="log-meta">
                <span class="log-action">{{ log.action }}</span>
                <span class="log-date">{{ log.createdAt | date:'MMM d, HH:mm' }}</span>
              </div>
              <p class="log-message">{{ log.details }}</p>
              <div class="log-footer">
                <span class="log-user">{{ log.userEmail }}</span>
                <span class="dot">•</span>
                <span class="log-entity">{{ log.entityType }} #{{ log.entityId }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="hasMore" class="load-more-container py-4 flex justify-center">
            <button mat-button (click)="loadMore()" [disabled]="loading" class="load-more-btn">
              <span *ngIf="!loading">Load More</span>
              <div *ngIf="loading" class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .audit-panel {
      position: fixed;
      right: -420px;
      top: 0;
      bottom: 0;
      width: 400px;
      background: #09090b;
      border-left: 1px solid #1C1C1E;
      display: flex;
      flex-direction: column;
      z-index: 1001;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .audit-panel.open {
      right: 0;
    }

    .audit-header {
      height: 64px;
      padding: 0 16px;
      background: rgba(13, 13, 15, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #1C1C1E;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-wrapper {
      width: 36px;
      height: 36px;
      background: rgba(94, 106, 210, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-text .title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #EDEDED;
    }

    .header-text .subtitle {
      font-size: 11px;
      color: #8A8F98;
    }

    .close-btn {
      color: #8A8F98 !important;
    }

    .audit-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #3A3C42;
    }

    .empty-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      margin-bottom: 12px;
    }

    .log-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .log-item {
      display: flex;
      gap: 12px;
      position: relative;
    }

    .log-marker {
      width: 3px;
      border-radius: 4px;
      background: #5E6AD2;
      flex-shrink: 0;
    }

    .marker-success { background: #10b981; }
    .marker-warning { background: #f59e0b; }
    .marker-danger { background: #ef4444; }

    .log-details {
      flex: 1;
    }

    .log-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .log-action {
      font-size: 10px;
      font-weight: 700;
      color: #5E6AD2;
      background: rgba(94, 106, 210, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .log-date {
      font-size: 10px;
      color: #46484E;
    }

    .log-message {
      margin: 0;
      font-size: 13px;
      color: #EDEDED;
      line-height: 1.5;
    }

    .log-footer {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: #8A8F98;
    }

    .dot { opacity: 0.3; }

    .load-more-btn {
      color: #5E6AD2 !important;
      font-size: 11px !important;
      font-weight: 600 !important;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #1C1C1E;
      border-radius: 10px;
    }
  `]
})
export class AuditSidebarComponent implements OnInit {
    @Input() projectId!: number;

    isOpen = false;
    loading = false;
    logs: AuditLog[] = [];

    pageIndex = 0;
    pageSize = 20;
    hasMore = true;

    private auditLogService = inject(AuditLogService);

    ngOnInit(): void { }

    toggle(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen && this.projectId && this.logs.length === 0) {
            this.loadLogs();
        }
    }

    loadLogs(page: number = this.pageIndex): void {
        this.loading = true;
        this.auditLogService.getLogsByProject(this.projectId, page, this.pageSize).subscribe({
            next: (response) => {
                this.logs = [...this.logs, ...response.content];
                this.hasMore = !response.last;
                this.pageIndex = response.number;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadMore(): void {
        if (!this.loading && this.hasMore) {
            this.loadLogs(this.pageIndex + 1);
        }
    }

    getMarkerClass(action: string): string {
        switch (action) {
            case 'CREATE':
            case 'ADD_MEMBER':
            case 'UPLOAD_ATTACHMENT':
                return 'marker-success';
            case 'UPDATE':
            case 'UPDATE_ROLE':
                return 'marker-warning';
            case 'DELETE':
            case 'REMOVE_MEMBER':
            case 'DELETE_ATTACHMENT':
                return 'marker-danger';
            default:
                return '';
        }
    }
}


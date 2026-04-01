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
    templateUrl: './audit-sidebar.component.html',
    styleUrl: './audit-sidebar.component.css'
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


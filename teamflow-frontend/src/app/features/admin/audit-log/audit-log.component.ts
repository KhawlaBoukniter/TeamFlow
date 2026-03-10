import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog } from '../../../shared/models/audit-log.model';

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatPaginatorModule
    ],
    templateUrl: './audit-log.component.html',
    styles: [`
        .audit-table {
            width: 100%;
            background: #1C1C1E !important;
            border-radius: 12px 12px 0 0;
            overflow: hidden;
            border: 1px solid #2E3035;
            border-bottom: none;
        }
        ::ng-deep .mat-mdc-paginator {
            background: #1C1C1E !important;
            color: #8A8F98 !important;
            border: 1px solid #2E3035;
            border-top: 1px solid #2E3035;
            border-radius: 0 0 12px 12px;
        }
        ::ng-deep .mat-mdc-paginator .mat-mdc-select-value,
        ::ng-deep .mat-mdc-paginator .mat-mdc-paginator-range-label {
            color: #8A8F98 !important;
        }
        ::ng-deep .mat-mdc-icon-button[disabled] {
            color: rgba(138, 143, 152, 0.3) !important;
        }
        ::ng-deep .mat-mdc-icon-button {
            color: #8A8F98 !important;
        }
        ::ng-deep .audit-table .mat-mdc-header-cell {
            background: #25262B !important;
            color: #8A8F98 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #2E3035 !important;
        }
        ::ng-deep .audit-table .mat-mdc-cell {
            color: #E4E4E7 !important;
            border-bottom: 1px solid #2E3035 !important;
            padding: 12px 16px !important;
        }
        ::ng-deep .audit-table .mat-mdc-row:hover {
            background: #25262B !important;
        }
        .badge-create { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-update { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-delete { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-move { background: rgba(94, 106, 210, 0.2); color: #5E6AD2; border: 1px solid rgba(94, 106, 210, 0.3); }
        .badge-default { background: rgba(138, 143, 152, 0.2); color: #8A8F98; border: 1px solid rgba(138, 143, 152, 0.3); }
    `]
})
export class AuditLogComponent implements OnInit {
    logs = new MatTableDataSource<AuditLog>([]);
    loading = true;
    error: string | null = null;
    displayedColumns: string[] = ['date', 'user', 'action', 'entity', 'details'];

    totalElements = 0;
    pageSize = 20;
    pageIndex = 0;

    private auditLogService = inject(AuditLogService);

    get createCount(): number {
        return this.logs.data.filter(l => l.action === 'CREATE').length;
    }

    get updateCount(): number {
        return this.logs.data.filter(l => l.action === 'UPDATE').length;
    }

    get deleteCount(): number {
        return this.logs.data.filter(l => l.action === 'DELETE').length;
    }

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(page: number = this.pageIndex, size: number = this.pageSize): void {
        this.loading = true;
        this.auditLogService.getAllLogs(page, size).subscribe({
            next: (response) => {
                this.logs.data = response.content;
                this.totalElements = response.totalElements;
                this.pageIndex = response.number;
                this.pageSize = response.size;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load audit logs. Please ensure you have admin privileges.';
                this.loading = false;
                console.error('Error fetching logs', err);
            }
        });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadLogs(this.pageIndex, this.pageSize);
    }

    getActionClass(action: string): string {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'badge-create';
            case 'UPDATE': return 'badge-update';
            case 'DELETE': return 'badge-delete';
            case 'MOVE': return 'badge-move';
            default: return 'badge-default';
        }
    }
}

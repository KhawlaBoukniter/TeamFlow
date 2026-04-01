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
    styleUrl: './audit-log.component.css'
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog } from '../../../shared/models/audit-log.model';

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './audit-log.component.html',
    styles: [`
    .audit-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .audit-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .audit-table th, .audit-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #f3f4f6;
    }
    .audit-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    .badge {
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-create { background: #dcfce7; color: #166534; }
    .badge-update { background: #fef9c3; color: #854d0e; }
    .badge-delete { background: #fee2e2; color: #991b1b; }
    .badge-move { background: #e0e7ff; color: #3730a3; }
    .badge-default { background: #f3f4f6; color: #374151; }
  `]
})
export class AuditLogComponent implements OnInit {
    logs: AuditLog[] = [];
    loading = true;
    error: string | null = null;

    constructor(private auditLogService: AuditLogService) { }

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(): void {
        this.loading = true;
        this.auditLogService.getAllLogs().subscribe({
            next: (data) => {
                this.logs = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load audit logs. Please ensure you have admin privileges.';
                this.loading = false;
                console.error('Error fetching logs', err);
            }
        });
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

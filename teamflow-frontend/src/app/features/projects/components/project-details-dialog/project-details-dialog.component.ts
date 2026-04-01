import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Project, AuditLog } from '../../../../shared/models';
import { ProjectEditDialogComponent } from '../project-edit-dialog/project-edit-dialog.component';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-project-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './project-details-dialog.component.html',
  styleUrl: './project-details-dialog.component.css'
})
export class ProjectDetailsDialogComponent implements OnInit {
  project: Project;
  ownerEmail: string | null;
  auditLogs: AuditLog[] = [];
  loadingLogs = false;

  pageIndex = 0;
  pageSize = 10;
  hasMore = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { project: Project },
    private dialogRef: MatDialogRef<ProjectDetailsDialogComponent>,
    private dialog: MatDialog,
    private auditLogService: AuditLogService,
    private authService: AuthService
  ) {
    this.project = data.project;
    this.ownerEmail = this.project.ownerEmail || null;
  }

  ngOnInit(): void {
    if (this.isManager()) {
      this.loadAuditLogs();
    }
  }

  loadAuditLogs(pageIndex: number = this.pageIndex): void {
    this.loadingLogs = true;
    this.auditLogService.getLogsByProject(this.project.id, pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.auditLogs = [...this.auditLogs, ...response.content];
        this.hasMore = !response.last;
        this.pageIndex = response.number;
        this.loadingLogs = false;
      },
      error: () => {
        this.loadingLogs = false;
      }
    });
  }

  loadMore(): void {
    if (!this.loadingLogs && this.hasMore) {
      this.loadAuditLogs(this.pageIndex + 1);
    }
  }

  isManager(): boolean {
    if (this.authService.isAdmin()) return true;
    const currentUserId = this.authService.getCurrentUserId();
    if (this.project.ownerId === currentUserId) return true;

    return true;
  }

  openEditDialog(): void {
    const editDialogRef = this.dialog.open(ProjectEditDialogComponent, {
      width: '800px',
      data: { project: this.project },
      panelClass: 'linear-dialog'
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ refreshNeeded: true });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  isTeamProject(): boolean {
    return this.project.type === 'TEAM';
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30';
      case 'ARCHIVED': return 'bg-[#2C2D32] text-[#8A8F98] border-[#3A3C42]';
      default: return 'bg-[#2C2D32] text-[#8A8F98] border-[#3A3C42]';
    }
  }

  getTypeColor(type: string | undefined): string {
    return 'border-[#3A3C42] text-[#8A8F98]';
  }

  getLogActionColor(action: string): string {
    switch (action) {
      case 'CREATE':
      case 'ADD_MEMBER':
      case 'UPLOAD_ATTACHMENT':
      case 'CREATE_COMMENT':
        return 'bg-emerald-500';
      case 'UPDATE':
      case 'UPDATE_ROLE':
      case 'UPDATE_COMMENT':
        return 'bg-amber-500';
      case 'DELETE':
      case 'REMOVE_MEMBER':
      case 'DELETE_ATTACHMENT':
      case 'DELETE_COMMENT':
        return 'bg-red-500';
      default:
        return 'bg-brand';
    }
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Project } from '../../../../shared/models';
import { ProjectEditDialogComponent } from '../project-edit-dialog/project-edit-dialog.component';
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
  template: `
    <div class="dialog-header p-6 pb-0 flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border bg-[#2C2D32]" 
                [ngClass]="getTypeColor(project.type)">
            {{ project.type === 'PERSONAL' ? 'Personal' : 'Team' }}
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border" 
                [ngClass]="getStatusColor(project.status)">
            {{ project.status }}
          </span>
        </div>
        <h2 class="text-2xl font-bold text-white tracking-tight">{{ project.name }}</h2>
      </div>
      <button mat-icon-button class="!text-[#8A8F98] hover:!text-white transition-colors" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="!p-0">
      <mat-tab-group class="project-details-tabs" animationDuration="0ms">
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="p-6 space-y-8">
            <!-- Description -->
            <div>
              <h3 class="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider mb-2">Description</h3>
              <p class="text-sm text-[#D1D5DB] leading-relaxed">{{ project.description || 'No description provided.' }}</p>
            </div>

            <!-- Grid Details -->
            <div class="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <h3 class="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider mb-1">Owner</h3>
                <div class="flex items-center gap-2">
                   <div class="h-5 w-5 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white">
                      {{ (ownerEmail || 'U').charAt(0).toUpperCase() }}
                   </div>
                   <span class="text-sm text-white font-medium">{{ ownerEmail || 'Unknown' }}</span>
                </div>
              </div>

              <div>
                <h3 class="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider mb-1">Created</h3>
                <p class="text-sm text-white font-medium">{{ project.createdAt | date:'mediumDate' }}</p>
              </div>

              <div>
                <h3 class="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider mb-1">Timeline</h3>
                <div class="flex items-center gap-2 text-sm text-white font-medium">
                  <span>{{ project.startDate ? (project.startDate | date:'MMM d') : 'Now' }}</span>
                  <mat-icon class="!w-3 !h-3 !text-[12px] text-[#8A8F98]">arrow_forward</mat-icon>
                  <span>{{ project.endDate ? (project.endDate | date:'MMM d, y') : 'No Deadline' }}</span>
                </div>
              </div>

               <div>
                <h3 class="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider mb-1">Last Updated</h3>
                <p class="text-sm text-[#8A8F98]">{{ project.updatedAt | date:'medium' }}</p>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="pt-2">
              <button mat-stroked-button (click)="openEditDialog()"
                class="!border-[#3A3C42] !text-white !rounded-md w-full hover:!bg-[#2C2D32] transition-all">
                <mat-icon class="!w-4 !h-4 !text-[16px] mr-2">edit</mat-icon>
                Edit Project Details
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Members -->
        <mat-tab label="Members" *ngIf="isTeamProject()">
          <div class="p-8 text-center">
            <div class="w-12 h-12 rounded-full bg-[#2C2D32] flex items-center justify-center mx-auto mb-3">
                <mat-icon class="!w-6 !h-6 !text-[24px] text-[#8A8F98]">group</mat-icon>
            </div>
            <h3 class="text-white font-medium mb-1">Team Members</h3>
            <p class="text-[#8A8F98] text-sm mb-4">View and manage the team assigned to this project.</p>
            <button mat-stroked-button class="!border-[#3A3C42] !text-white !rounded-md" disabled>
                Manage Members (Coming Soon)
            </button>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
  `,
  styles: [`
    :host ::ng-deep .project-details-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid #2E3035;
      padding: 0 24px;
    }
    
    :host ::ng-deep .project-details-tabs .mat-mdc-tab-label {
      color: #8A8F98;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      min-width: 0;
      padding: 0 16px;
    }
    
    :host ::ng-deep .project-details-tabs .mat-mdc-tab-label-active {
      color: white;
    }
    
    :host ::ng-deep .project-details-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content--underline {
      border-color: #5E6AD2; /* Brand color */
    }
  `]
})
export class ProjectDetailsDialogComponent implements OnInit {
  project: Project;
  ownerEmail: string | null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { project: Project },
    private dialogRef: MatDialogRef<ProjectDetailsDialogComponent>,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.project = data.project;
    this.ownerEmail = this.authService.getUserEmail();
  }

  ngOnInit(): void {
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
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Project } from '../../../../shared/models';
import { ProjectEditDialogComponent } from '../project-edit-dialog/project-edit-dialog.component';

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
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <div class="flex items-center gap-3">
          <span class="text-xl font-semibold text-gray-900">{{ project.name }}</span>
          <span class="px-2 py-0.5 rounded text-xs font-medium" [ngClass]="getStatusColor(project.status)">
            {{ project.status }}
          </span>
          <span class="px-2 py-0.5 rounded text-xs font-medium" [ngClass]="getTypeColor(project.type)">
            {{ project.type }}
          </span>
        </div>
      </h2>
      <button mat-icon-button class="dialog-close-button" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <mat-tab-group class="project-details-tabs">
        <!-- Tab 1: Overview -->
        <mat-tab label="Overview">
          <div class="p-4 space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p class="text-sm text-gray-600">{{ project.description || 'No description' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">Created At</h3>
                <p class="text-sm text-gray-600">{{ project.createdAt | date:'medium' }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">Last Updated</h3>
                <p class="text-sm text-gray-600">{{ project.updatedAt | date:'medium' }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">Start Date</h3>
                <p class="text-sm text-gray-600">{{ project.startDate ? (project.startDate | date:'mediumDate') : 'Not set' }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">End Date</h3>
                <p class="text-sm text-gray-600">{{ project.endDate ? (project.endDate | date:'mediumDate') : 'Not set' }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">Owner ID</h3>
                <p class="text-sm text-gray-600">{{ project.ownerId }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-gray-700 mb-1">Project ID</h3>
                <p class="text-sm text-gray-600">{{ project.id }}</p>
              </div>
            </div>

            <div class="pt-4">
              <button mat-raised-button color="primary" (click)="openEditDialog()"
                class="bg-brand hover:bg-brand-hover">
                <mat-icon class="!w-4 !h-4 !text-[16px] mr-1">edit</mat-icon>
                Edit Project
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Members (Only for TEAM projects) -->
        <mat-tab label="Members" *ngIf="isTeamProject()">
          <div class="p-4 text-center text-gray-400">
            <mat-icon class="!w-12 !h-12 !text-[48px] mb-2">group</mat-icon>
            <p>Members feature coming soon</p>
            <p class="text-xs">View and manage team members</p>
          </div>
        </mat-tab>

        <!-- Tab 3: Activity (Future) -->
        <mat-tab label="Activity">
          <div class="p-4 text-center text-gray-400">
            <mat-icon class="!w-12 !h-12 !text-[48px] mb-2">history</mat-icon>
            <p>Activity log coming soon</p>
            <p class="text-xs">Recent changes and updates</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      position: relative;
    }
    
    .dialog-close-button {
      position: absolute !important;
      top: 12px;
      right: 12px;
    }
    
    .project-details-tabs {
      min-height: 300px;
    }
  `]
})
export class ProjectDetailsDialogComponent implements OnInit {
  project: Project;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { project: Project },
    private dialogRef: MatDialogRef<ProjectDetailsDialogComponent>,
    private dialog: MatDialog
  ) {
    this.project = data.project;
  }

  ngOnInit(): void {
    // Could load additional stats here if needed
  }

  openEditDialog(): void {
    const editDialogRef = this.dialog.open(ProjectEditDialogComponent, {
      width: '600px',
      data: { project: this.project }
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Project was updated, close this dialog and signal refresh
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
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getTypeColor(type: string | undefined): string {
    switch (type) {
      case 'TEAM': return 'bg-blue-100 text-blue-700';
      case 'PERSONAL': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}

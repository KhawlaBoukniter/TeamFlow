import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../shared/models';

@Component({
    selector: 'app-project-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule,
        MatIconModule
    ],
    template: `
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <mat-icon class="text-indigo-600" style="font-size: 24px; width: 24px; height: 24px;">edit</mat-icon>
        <h2 class="text-lg font-semibold m-0" style="line-height: 24px;">Edit Project</h2>
      </div>
    </div>
    <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-5 min-w-[500px]">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Project Name *</mat-label>
          <input matInput formControlName="name" placeholder="Project name">
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">Name is required</mat-error>
          <mat-error *ngIf="projectForm.get('name')?.hasError('minlength')">Name must be at least 3 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Project description"></textarea>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Project Type *</mat-label>
            <mat-select formControlName="type">
              <mat-option value="PERSONAL">Personal</mat-option>
              <mat-option value="TEAM">Team</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status *</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="ARCHIVED">Archived</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-error *ngIf="projectForm.hasError('dateRange')" class="text-sm">
          End date must be after start date
        </mat-error>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-3">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="projectForm.invalid || loading">
          {{ loading ? 'Updating...' : 'Update Project' }}
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class ProjectEditDialogComponent {
    projectForm: FormGroup;
    loading = false;
    project: Project;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { project: Project },
        private dialogRef: MatDialogRef<ProjectEditDialogComponent>,
        private fb: FormBuilder,
        private projectService: ProjectService,
        private snackBar: MatSnackBar
    ) {
        this.project = data.project;

        this.projectForm = this.fb.group({
            name: [this.project.name, [Validators.required, Validators.minLength(3)]],
            description: [this.project.description || ''],
            type: [this.project.type || 'PERSONAL'],
            status: [this.project.status || 'ACTIVE'],
            startDate: [this.project.startDate ? new Date(this.project.startDate) : null],
            endDate: [this.project.endDate ? new Date(this.project.endDate) : null]
        }, { validators: this.dateRangeValidator });
    }

    dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
        const start = group.get('startDate')?.value;
        const end = group.get('endDate')?.value;
        if (start && end && new Date(start) > new Date(end)) {
            return { dateRange: true };
        }
        return null;
    }

    onSubmit(): void {
        if (this.projectForm.invalid) return;

        this.loading = true;
        const formValue = this.projectForm.value;

        // Convert dates to ISO strings
        const updateData: Partial<Project> = {
            ...formValue,
            startDate: formValue.startDate ? new Date(formValue.startDate).toISOString().split('T')[0] : null,
            endDate: formValue.endDate ? new Date(formValue.endDate).toISOString().split('T')[0] : null
        };

        this.projectService.updateProject(this.project.id, updateData).subscribe({
            next: (updatedProject) => {
                this.loading = false;
                this.snackBar.open('Project updated successfully', 'Close', { duration: 2000 });
                this.dialogRef.close(updatedProject);
            },
            error: (err) => {
                this.loading = false;
                console.error('Failed to update project', err);
                this.snackBar.open('Failed to update project', 'Close', { duration: 3000 });
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

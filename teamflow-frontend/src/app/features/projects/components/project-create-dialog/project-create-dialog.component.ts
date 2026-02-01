
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../shared/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-project-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-4 min-w-[400px]">
        <mat-form-field appearance="outline">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="Ex: TeamFlow Redesign">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Name must be at least 3 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Project details..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ACTIVE">Active</mat-option>
            <mat-option value="ARCHIVED">Archived</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="PERSONAL">Personal</mat-option>
            <mat-option value="TEAM">Team</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="flex gap-4">
            <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
        </div>

        <mat-error *ngIf="form.hasError('dateRange') && (form.get('startDate')?.touched || form.get('endDate')?.touched)" class="text-sm">
            End date must be after start date
        </mat-error>

      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Creating...' : 'Create Project' }}
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class ProjectCreateDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private dialogRef: MatDialogRef<ProjectCreateDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      startDate: [null],
      endDate: [null],
      status: ['ACTIVE', Validators.required],
      type: ['PERSONAL', Validators.required]
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
    if (this.form.invalid) return;

    this.loading = true;
    const projectData: Project = this.form.value;

    this.projectService.createProject(projectData).subscribe({
      next: (newProject) => {
        this.loading = false;
        this.snackBar.open('Project created successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(newProject);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create project', err);
        this.snackBar.open(err.error?.message || 'Failed to create project', 'Close', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

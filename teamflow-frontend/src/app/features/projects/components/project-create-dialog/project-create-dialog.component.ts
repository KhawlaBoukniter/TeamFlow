
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
        MatNativeDateModule
    ],
    template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-4 min-w-[400px]">
        <mat-form-field appearance="outline">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="Ex: TeamFlow Redesign">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Project details..."></textarea>
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
        private dialogRef: MatDialogRef<ProjectCreateDialogComponent>
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            startDate: [null],
            endDate: [null],
            status: ['PLANNED'] // Default status
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading = true;
        const projectData: Project = this.form.value;

        this.projectService.createProject(projectData).subscribe({
            next: (newProject) => {
                this.loading = false;
                this.dialogRef.close(newProject);
            },
            error: (err) => {
                this.loading = false;
                console.error('Failed to create project', err);
                // Error is handled by global interceptor/handler
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

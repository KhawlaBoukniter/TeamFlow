import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
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
    templateUrl: './project-edit-dialog.component.html'
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
            startDate: [this.project.startDate ? new Date(this.project.startDate) : null, [this.futureDateValidator]],
            endDate: [this.project.endDate ? new Date(this.project.endDate) : null, [this.futureDateValidator]]
        }, { validators: this.dateRangeValidator });
    }

    futureDateValidator(control: FormControl): { [key: string]: boolean } | null {
        if (control.value) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(control.value) < today) {
                return { futureDate: true };
            }
        }
        return null;
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

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Task, TaskPriority } from '../../../../shared/models';

@Component({
    selector: 'app-edit-task-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule
    ],
    templateUrl: './edit-task-dialog.component.html',
    styleUrl: './edit-task-dialog.component.css'
})
export class EditTaskDialogComponent {
    taskForm: FormGroup;
    priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<EditTaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task }
    ) {
        this.taskForm = this.fb.group({
            title: [data.task.title, [Validators.required, Validators.minLength(3)]],
            description: [data.task.description || ''],
            priority: [data.task.priority, Validators.required],
            dueDate: [data.task.dueDate ? new Date(data.task.dueDate) : null],
            blocked: [data.task.blocked === true]
        });
    }

    onSubmit(): void {
        if (this.taskForm.valid) {
            const formValue = this.taskForm.value;

            if (formValue.dueDate instanceof Date) {
                formValue.dueDate = formValue.dueDate.toISOString().split('T')[0];
            }

            formValue.blocked = formValue.blocked === true;

            this.dialogRef.close(formValue);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

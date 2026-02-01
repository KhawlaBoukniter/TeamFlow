import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskPriority } from '../../../shared/models';

@Component({
    selector: 'app-task-create-edit',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatDialogModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule
    ],
    templateUrl: './task-create-edit.component.html'
})
export class TaskCreateEditComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    priorities = Object.values(TaskPriority);
    loading = false;

    constructor(
        private fb: FormBuilder,
        private taskService: TaskService,
        private dialogRef: MatDialogRef<TaskCreateEditComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task?: Task; columnId: number }
    ) {
        this.form = this.fb.group({
            title: ['', Validators.required],
            description: [''],
            priority: [TaskPriority.MEDIUM, Validators.required],
            dueDate: [null],
            isBlocked: [false]
        });
    }

    ngOnInit(): void {
        if (this.data.task) {
            this.isEdit = true;
            this.form.patchValue(this.data.task);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading = true;
        const taskData = this.form.value;

        // Format date if needed or handled by backend wrapper? Angular Material returns Date object.
        // Ensure backend accepts standard ISO string or format.

        if (this.isEdit && this.data.task) {
            this.taskService.updateTask(this.data.task.id, taskData).subscribe({
                next: (updatedTask) => {
                    this.dialogRef.close(updatedTask);
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
        } else {
            taskData.columnId = this.data.columnId;
            // Default position logic might be needed backend side or we fetch tasks count. 
            // Minimal implementation:
            this.taskService.createTask(taskData).subscribe({
                next: (newTask) => {
                    this.dialogRef.close(newTask);
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

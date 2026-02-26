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
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task, TaskPriority, TaskSummary } from '../../../../shared/models';
import { TaskService as TaskItemsService } from '../../../../core/services/task.service';

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
        MatIconModule,
        MatDividerModule,
        MatMenuModule
    ],
    templateUrl: './edit-task-dialog.component.html',
    styleUrl: './edit-task-dialog.component.css'
})
export class EditTaskDialogComponent {
    taskForm: FormGroup;
    priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];
    allAvailableTasks: any[] = [];
    currentDependencies: any[] = [];

    constructor(
        private fb: FormBuilder,
        private taskService: TaskItemsService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<EditTaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task, allTasks: Task[] }
    ) {
        this.taskForm = this.fb.group({
            title: [data.task.title, [Validators.required, Validators.minLength(3)]],
            description: [data.task.description || ''],
            priority: [data.task.priority, Validators.required],
            dueDate: [data.task.dueDate ? new Date(data.task.dueDate) : null]
        });

        this.currentDependencies = data.task.blockingTasks || [];
        this.updateAvailableTasks();
    }

    updateAvailableTasks(): void {
        const depIds = this.currentDependencies.map(d => d.id);
        this.allAvailableTasks = (this.data.allTasks || [])
            .filter(t => t.id !== this.data.task.id && !depIds.includes(t.id));
    }

    addDependency(dependencyId: number): void {
        this.taskService.addDependency(this.data.task.id, dependencyId).subscribe({
            next: () => {
                const dep = this.data.allTasks.find(t => t.id === dependencyId);
                if (dep) {
                    this.currentDependencies.push(dep);
                    this.updateAvailableTasks();
                    this.snackBar.open('Dependency added', 'Close', { duration: 2000 });
                }
            },
            error: (err) => {
                this.snackBar.open(err.error?.message || 'Failed to add dependency', 'Close', { duration: 3000 });
            }
        });
    }

    removeDependency(dependencyId: number): void {
        this.taskService.removeDependency(this.data.task.id, dependencyId).subscribe({
            next: () => {
                this.currentDependencies = this.currentDependencies.filter(d => d.id !== dependencyId);
                this.updateAvailableTasks();
                this.snackBar.open('Dependency removed', 'Close', { duration: 2000 });
            },
            error: () => {
                this.snackBar.open('Failed to remove dependency', 'Close', { duration: 3000 });
            }
        });
    }

    onSubmit(): void {
        if (this.taskForm.valid) {
            const formValue = this.taskForm.value;

            if (formValue.dueDate instanceof Date) {
                formValue.dueDate = formValue.dueDate.toISOString().split('T')[0];
            }

            this.dialogRef.close(formValue);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

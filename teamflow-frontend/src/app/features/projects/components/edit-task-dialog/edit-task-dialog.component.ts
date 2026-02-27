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
import { Task, TaskPriority, TaskSummary, Attachment } from '../../../../shared/models';
import { TaskService as TaskItemsService } from '../../../../core/services/task.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { HttpEventType } from '@angular/common/http';

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
    currentAttachments: Attachment[] = [];
    uploadProgress: number | null = null;
    hasChanges = false;

    constructor(
        private fb: FormBuilder,
        private taskService: TaskItemsService,
        private attachmentService: AttachmentService,
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
        this.currentAttachments = data.task.attachments || [];
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
                    this.hasChanges = true;
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
                this.hasChanges = true;
                this.updateAvailableTasks();
                this.snackBar.open('Dependency removed', 'Close', { duration: 2000 });
            },
            error: () => {
                this.snackBar.open('Failed to remove dependency', 'Close', { duration: 3000 });
            }
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.attachmentService.upload(this.data.task.id, file).subscribe({
                next: (event: any) => {
                    if (event.type === HttpEventType.UploadProgress) {
                        this.uploadProgress = Math.round(100 * event.loaded / event.total);
                    } else if (event.type === HttpEventType.Response) {
                        this.currentAttachments.push(event.body);
                        this.uploadProgress = null;
                        this.hasChanges = true;
                        this.snackBar.open('File uploaded successfully', 'Close', { duration: 2000 });
                    }
                },
                error: () => {
                    this.uploadProgress = null;
                    this.snackBar.open('File upload failed', 'Close', { duration: 3000 });
                }
            });
        }
    }

    downloadAttachment(attachment: Attachment): void {
        this.attachmentService.download(attachment.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.snackBar.open('Download failed', 'Close', { duration: 3000 });
            }
        });
    }

    deleteAttachment(attachmentId: number): void {
        this.attachmentService.delete(attachmentId).subscribe({
            next: () => {
                this.currentAttachments = this.currentAttachments.filter(a => a.id !== attachmentId);
                this.hasChanges = true;
                this.snackBar.open('File deleted', 'Close', { duration: 2000 });
            },
            error: () => {
                this.snackBar.open('Delete failed', 'Close', { duration: 3000 });
            }
        });
    }

    formatFileSize(bytes: number): string {
        return this.attachmentService.getFileSizeDisplay(bytes);
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
        this.dialogRef.close(this.hasChanges ? { refreshNeeded: true } : undefined);
    }
}

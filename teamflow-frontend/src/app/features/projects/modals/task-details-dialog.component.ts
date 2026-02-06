import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Task, SubTask, Comment, TaskAssignment } from '../../../shared/models';
import { SubTaskService } from '../../../core/services/subtask.service';
import { CommentService } from '../../../core/services/comment.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { MatDialog } from '@angular/material/dialog';
import { EditTaskDialogComponent } from '../components/edit-task-dialog/edit-task-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-task-details-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatTabsModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule
    ],
    templateUrl: './task-details-dialog.component.html',
    styleUrl: './task-details-dialog.component.css'
})
export class TaskDetailsDialogComponent implements OnInit {
    task: Task;
    projectType: string;
    subTasks: SubTask[] = [];
    comments: Comment[] = [];
    assignments: TaskAssignment[] = [];

    newSubTaskForm: FormGroup;
    newCommentForm: FormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; projectType?: string },
        private dialogRef: MatDialogRef<TaskDetailsDialogComponent>,
        private subTaskService: SubTaskService,
        private commentService: CommentService,
        private assignmentService: AssignmentService,
        private fb: FormBuilder,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        this.task = data.task;
        this.projectType = data.projectType || 'PERSONAL';

        this.newSubTaskForm = this.fb.group({
            title: ['']
        });

        this.newCommentForm = this.fb.group({
            content: ['']
        });
    }

    ngOnInit(): void {
        this.loadSubTasks();
        this.loadComments();
        this.loadAssignments();
    }

    loadSubTasks(): void {
        this.subTaskService.getSubTasksByTask(this.task.id).subscribe({
            next: (subTasks) => this.subTasks = subTasks,
            error: (err) => console.error('Failed to load subtasks', err)
        });
    }

    loadComments(): void {
        this.commentService.getCommentsByTask(this.task.id).subscribe({
            next: (comments) => this.comments = comments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
            error: (err) => console.error('Failed to load comments', err)
        });
    }

    loadAssignments(): void {
        this.assignmentService.getAssignmentsByTask(this.task.id).subscribe({
            next: (assignments) => this.assignments = assignments,
            error: (err) => console.error('Failed to load assignments', err)
        });
    }

    addSubTask(): void {
        const title = this.newSubTaskForm.value.title?.trim();
        if (!title) return;

        this.subTaskService.createSubTask(this.task.id, { title, completed: false }).subscribe({
            next: () => {
                this.loadSubTasks();
                this.newSubTaskForm.reset();
                this.snackBar.open('Subtask added', 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Failed to create subtask', err);
                this.snackBar.open('Failed to add subtask', 'Close', { duration: 3000 });
            }
        });
    }

    toggleSubTask(subTask: SubTask): void {
        this.subTaskService.updateSubTask(subTask.id, { completed: !subTask.completed }).subscribe({
            next: () => this.loadSubTasks(),
            error: (err) => {
                console.error('Failed to toggle subtask', err);
                this.snackBar.open('Failed to update subtask', 'Close', { duration: 3000 });
            }
        });
    }

    deleteSubTask(id: number): void {
        if (!confirm('Delete this subtask?')) return;

        this.subTaskService.deleteSubTask(id).subscribe({
            next: () => {
                this.loadSubTasks();
                this.snackBar.open('Subtask deleted', 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Failed to delete subtask', err);
                this.snackBar.open('Failed to delete subtask', 'Close', { duration: 3000 });
            }
        });
    }

    addComment(): void {
        const content = this.newCommentForm.value.content?.trim();
        if (!content) return;

        // TODO: Get current user ID from AuthService
        const userId = 1; // Hardcoded for now

        this.commentService.createComment(this.task.id, userId, { content }).subscribe({
            next: () => {
                this.loadComments();
                this.newCommentForm.reset();
                this.snackBar.open('Comment added', 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Failed to create comment', err);
                this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
            }
        });
    }

    deleteComment(id: number): void {
        if (!confirm('Delete this comment?')) return;

        this.commentService.deleteComment(id).subscribe({
            next: () => {
                this.loadComments();
                this.snackBar.open('Comment deleted', 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Failed to delete comment', err);
                this.snackBar.open('Failed to delete comment', 'Close', { duration: 3000 });
            }
        });
    }

    openEditDialog(): void {
        const dialogRef = this.dialog.open(EditTaskDialogComponent, {
            width: '600px',
            data: { task: this.task }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Task was updated, refresh
                this.dialogRef.close({ refreshNeeded: true });
            }
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'HIGH': return 'bg-orange-100 text-orange-700';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700';
            case 'LOW': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    isTeamProject(): boolean {
        return this.projectType === 'TEAM';
    }
}

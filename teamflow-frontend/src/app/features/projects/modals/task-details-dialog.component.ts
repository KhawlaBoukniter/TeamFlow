import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Task, SubTask, Comment, TaskAssignment, User, Membership } from '../../../shared/models';
import { SubTaskService } from '../../../core/services/subtask.service';
import { CommentService } from '../../../core/services/comment.service';
import { TaskService } from '../../../core/services/task.service';
import { MembershipService } from '../../../core/services/membership.service';
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
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        ReactiveFormsModule,
        FormsModule
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
    allTasks: Task[] = []; // List of all tasks in the project (for dependency selection)
    selectedDependencyId: number | null = null;

    // Assignment Logic
    projectId?: number;
    projectMembers: Membership[] = [];
    showAssignmentDropdown = false;

    newSubTaskForm: FormGroup;
    newCommentForm: FormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; projectType?: string; projectId?: number; allTasks?: Task[] },
        private dialogRef: MatDialogRef<TaskDetailsDialogComponent>,
        private subTaskService: SubTaskService,
        private commentService: CommentService,
        private taskService: TaskService,
        private membershipService: MembershipService,
        private fb: FormBuilder,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        this.task = data.task;
        this.projectType = data.projectType || 'PERSONAL';
        this.projectId = data.projectId;
        this.allTasks = data.allTasks || []; // Receive all tasks from board

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
        if (this.isTeamProject() && this.projectId) {
            this.loadProjectMembers();
        }
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
        // Since we updated Task interface to include assignments, we might strictly speak
        // need to re-fetch task or rely on what's passed. 
        // If task object from board doesn't have assignments populated (depends on backend),
        // we might need a separate call. 
        // Assuming we need to fetch them if not present or to be sure.
        // Actually the backend Task entity has assignments, but let's check if we have an endpoint.
        // We added assignMember/removeAssignment to TaskService but not getAssignments (it's part of Task).
        // Let's assume we can refresh the task to get assignments.
        this.taskService.getTaskById(this.task.id).subscribe({
            next: (updatedTask) => {
                this.task = updatedTask;
                this.assignments = updatedTask.assignments || [];
            },
            error: (err) => console.error('Failed to refresh task assignments', err)
        });
    }

    loadProjectMembers(): void {
        if (!this.projectId) return;
        this.membershipService.getMembers(this.projectId).subscribe({
            next: (members) => this.projectMembers = members,
            error: (err) => console.error('Failed to load project members', err)
        });
    }

    assignMember(member: Membership): void {
        const role = 'CONTRIBUTOR'; // Default role for now
        this.taskService.assignMember(this.task.id, member.userId, role).subscribe({
            next: (assignment) => {
                // Determine user name/email from the member object since API might return basic assignment
                const newAssignment: TaskAssignment = {
                    ...assignment,
                    userName: member.userName,
                    userEmail: member.userEmail
                };
                this.assignments.push(newAssignment);
                this.showAssignmentDropdown = false;
                this.snackBar.open(`${member.userName} assigned`, 'Close', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to assign member', 'Close', { duration: 3000 })
        });
    }

    removeAssignment(assignment: TaskAssignment): void {
        if (!confirm(`Remove assignment for ${assignment.userName}?`)) return;

        this.taskService.removeAssignment(this.task.id, assignment.userId).subscribe({
            next: () => {
                this.assignments = this.assignments.filter(a => a.id !== assignment.id);
                this.snackBar.open('Assignment removed', 'Close', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to remove assignment', 'Close', { duration: 3000 })
        });
    }

    getUnassignedMembers(): Membership[] {
        const assignedUserIds = this.assignments.map(a => a.userId);
        return this.projectMembers.filter(m => !assignedUserIds.includes(m.userId));
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

    // Dependency Logic
    getAvailableTasks(): Task[] {
        // Filter out self and tasks that are already dependencies (either way)
        const existingIds = new Set([
            ...(this.task.blockingTasks?.map(t => t.id) || []),
            ...(this.task.blockedTasks?.map(t => t.id) || []),
            this.task.id
        ]);
        return this.allTasks.filter(t => !existingIds.has(t.id));
    }

    addDependency(): void {
        if (!this.selectedDependencyId) return;

        this.taskService.addDependency(this.task.id, this.selectedDependencyId).subscribe({
            next: () => {
                this.snackBar.open('Dependency added', 'Close', { duration: 3000 });
                this.selectedDependencyId = null;
                // Refresh task to get updated dependencies
                this.loadAssignments(); // Re-use this method which refreshes the whole task
            },
            error: (err) => {
                console.error('Failed to add dependency', err);
                this.snackBar.open(err.error?.message || 'Failed to add dependency', 'Close', { duration: 3000 });
            }
        });
    }

    removeDependency(dependencyId: number): void {
        if (!confirm('Remove this dependency?')) return;

        this.taskService.removeDependency(this.task.id, dependencyId).subscribe({
            next: () => {
                this.snackBar.open('Dependency removed', 'Close', { duration: 3000 });
                this.loadAssignments(); // Refresh task
            },
            error: (err) => {
                console.error('Failed to remove dependency', err);
                this.snackBar.open('Failed to remove dependency', 'Close', { duration: 3000 });
            }
        });
    }
}

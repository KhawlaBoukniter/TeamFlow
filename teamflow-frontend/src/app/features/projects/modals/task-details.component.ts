import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Task, SubTask, Comment } from '../../../shared/models';
import { TaskService } from '../../../core/services/task.service';
import { SubTaskService } from '../../../core/services/subtask.service';
import { CommentService } from '../../../core/services/comment.service';

@Component({
    selector: 'app-task-details',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatTabsModule, MatButtonModule, MatIconModule],
    templateUrl: './task-details.component.html'
})
export class TaskDetailsComponent implements OnInit {
    task: Task;
    subTasks: SubTask[] = [];
    comments: Comment[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { task: Task },
        private taskService: TaskService,
        private subTaskService: SubTaskService,
        private commentService: CommentService
    ) {
        this.task = data.task;
    }

    ngOnInit(): void {
        this.loadSubTasks();
        this.loadComments();
        // Refresh task details to get latest state
        this.taskService.getTaskById(this.task.id).subscribe(t => this.task = t);
    }

    loadSubTasks(): void {
        this.subTaskService.getSubTasksByTask(this.task.id).subscribe(st => this.subTasks = st);
    }

    loadComments(): void {
        this.commentService.getCommentsByTask(this.task.id).subscribe(c => this.comments = c);
    }
}

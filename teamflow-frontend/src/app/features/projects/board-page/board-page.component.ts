import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../../core/services/project.service';
import { ColumnService } from '../../../core/services/column.service';
import { TaskService } from '../../../core/services/task.service';
import { Project, ProjectColumn, Task } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskCreateEditComponent } from '../modals/task-create-edit.component';
import { TaskDetailsComponent } from '../modals/task-details.component';
import { CreateColumnDialogComponent } from '../components/create-column-dialog/create-column-dialog.component';
import { CreateTaskDialogComponent } from '../components/create-task-dialog/create-task-dialog.component';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatChipsModule
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.css'
})
export class BoardPageComponent implements OnInit {
  project: Project | null = null;
  columns: ProjectColumn[] = [];
  tasksByColumn: { [key: number]: Task[] } = {};
  connectedTo: string[] = [];

  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private columnService = inject(ColumnService);
  private taskService = inject(TaskService);
  private snackBar = inject(MatSnackBar);

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    if (projectId) {
      this.loadProject(projectId);
      this.loadColumns(projectId);
    }
  }

  loadProject(id: number): void {
    this.projectService.getProjectById(id).subscribe(p => this.project = p);
  }

  loadColumns(projectId: number): void {
    this.columnService.getColumnsByProject(projectId).subscribe({
      next: (cols) => {
        this.columns = cols.sort((a, b) => a.orderIndex - b.orderIndex);
        this.connectedTo = this.columns.map(c => `col-${c.id}`);
        this.columns.forEach(col => this.loadTasks(col.id));
      },
      error: (err) => {
        console.error('Failed to load columns', err);
        this.snackBar.open('Failed to load board columns', 'Close', { duration: 5000 });
      }
    });
  }

  loadTasks(columnId: number): void {
    this.taskService.getTasksByColumn(columnId).subscribe(tasks => {
      this.tasksByColumn[columnId] = tasks.sort((a, b) => a.position - b.position);
    });
  }

  getTasks(columnId: number): Task[] {
    return this.tasksByColumn[columnId] || [];
  }

  drop(event: CdkDragDrop<Task[]>, targetColumnId: number): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      this.taskService.moveTask(task.id, targetColumnId).subscribe({
        error: (err) => {
          console.error('Failed to move task', err);
          this.loadColumns(this.project!.id);
        }
      });
    }
  }

  moveTaskFallback(task: Task, targetColumnId: number): void {
    if (task.columnId === targetColumnId) return;

    const previousList = this.tasksByColumn[task.columnId];
    const targetList = this.tasksByColumn[targetColumnId] || [];

    const index = previousList.findIndex(t => t.id === task.id);
    if (index !== -1) {
      previousList.splice(index, 1);
      targetList.push({ ...task, columnId: targetColumnId });
      this.tasksByColumn[targetColumnId] = targetList;
    }

    this.taskService.moveTask(task.id, targetColumnId).subscribe({
      error: (err) => {
        console.error('Fallback move failed', err);
        this.loadColumns(this.project!.id);
      }
    });
  }
  openAddColumnDialog(): void {
    const dialogRef = this.dialog.open(CreateColumnDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.project) {
        const orderIndex = this.columns.length > 0
          ? Math.max(...this.columns.map(c => c.orderIndex)) + 1
          : 0;

        const payload: Partial<ProjectColumn> = {
          name: result.name,
          orderIndex: orderIndex
        };

        this.columnService.createColumn(this.project.id, payload).subscribe({
          next: () => {
            this.snackBar.open('Column added successfully', 'Close', { duration: 3000 });
            this.loadColumns(this.project!.id);
          },
          error: (err) => {
            console.error('Failed to create column', err);
            this.snackBar.open('Failed to create column', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openCreateTask(columnId: number): void {
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '600px',
      data: { columnId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.createTask(columnId, result).subscribe({
          next: () => {
            this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
            this.loadTasks(columnId);
          },
          error: (err) => {
            console.error('Failed to create task', err);
            this.snackBar.open('Failed to create task', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openTaskDetails(task: Task): void {
    const dialogRef = this.dialog.open(TaskDetailsComponent, {
      width: '800px',
      data: { task }
    });
  }
}

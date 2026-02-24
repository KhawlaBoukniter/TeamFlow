import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TaskCreateEditComponent } from '../modals/task-create-edit.component';
import { TaskDetailsDialogComponent } from '../modals/task-details-dialog.component';
import { CreateColumnDialogComponent } from '../components/create-column-dialog/create-column-dialog.component';
import { CreateTaskDialogComponent } from '../components/create-task-dialog/create-task-dialog.component';
import { EditTaskDialogComponent } from '../components/edit-task-dialog/edit-task-dialog.component';
import { MembersDialogComponent } from '../components/members-dialog/members-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DragDropModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MembersDialogComponent,
    CreateColumnDialogComponent,
    CreateTaskDialogComponent,
    MatTooltipModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.css'
})
export class BoardPageComponent implements OnInit {
  project: Project | null = null;
  columns: ProjectColumn[] = [];
  tasksByColumn: { [key: number]: Task[] } = {};
  connectedTo: string[] = [];

  // Filtering
  searchQuery: string = '';
  activeFilters = {
    priorities: [] as string[],
    assigneeIds: [] as number[]
  };

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
    this.taskService.getTasksByColumn(columnId).subscribe({
      next: (tasks) => {
        this.tasksByColumn[columnId] = tasks.sort((a, b) => a.position - b.position);
      },
      error: (err) => {
        console.error(`Failed to load tasks for column ${columnId}`, err);
        // Fallback to empty list to prevent UI breakage
        this.tasksByColumn[columnId] = [];
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
      }
    });
  }

  getTasks(columnId: number): Task[] {
    let tasks = this.tasksByColumn[columnId] || [];

    // Apply Search Filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(query));
    }

    // Apply Priority Filter
    if (this.activeFilters.priorities.length > 0) {
      tasks = tasks.filter(t => this.activeFilters.priorities.includes(t.priority));
    }

    // Apply Assignee Filter
    if (this.activeFilters.assigneeIds.length > 0) {
      tasks = tasks.filter(t =>
        t.assignments?.some(a => this.activeFilters.assigneeIds.includes(a.userId))
      );
    }

    return tasks;
  }

  togglePriorityFilter(priority: string): void {
    const index = this.activeFilters.priorities.indexOf(priority);
    if (index >= 0) {
      this.activeFilters.priorities.splice(index, 1);
    } else {
      this.activeFilters.priorities.push(priority);
    }
  }

  toggleAssigneeFilter(userId: number): void {
    const index = this.activeFilters.assigneeIds.indexOf(userId);
    if (index >= 0) {
      this.activeFilters.assigneeIds.splice(index, 1);
    } else {
      this.activeFilters.assigneeIds.push(userId);
    }
  }

  clearFilters(): void {
    this.activeFilters.priorities = [];
    this.activeFilters.assigneeIds = [];
    this.searchQuery = '';
  }

  get hasActiveFilters(): boolean {
    return this.activeFilters.priorities.length > 0 || this.activeFilters.assigneeIds.length > 0 || !!this.searchQuery;
  }

  getAvailableAssignees(): any[] {
    const assignees = new Map<number, any>();
    Object.values(this.tasksByColumn).flat().forEach(task => {
      task.assignments?.forEach(a => {
        if (!assignees.has(a.userId)) {
          assignees.set(a.userId, { id: a.userId, name: a.userName, email: a.userEmail });
        }
      });
    });
    return Array.from(assignees.values());
  }

  drop(event: CdkDragDrop<Task[]>, targetColumnId: number): void {
    // Same column reorder
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Cross-column move
    const task = event.previousContainer.data[event.previousIndex];
    const sourceColumnId = task.columnId;

    // Optimistic update: move in UI immediately
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update task's columnId for consistency
    task.columnId = targetColumnId;

    // API call
    this.taskService.moveTask(task.id, targetColumnId).subscribe({
      next: () => {
        this.snackBar.open('Task moved successfully', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Failed to move task', err);

        // Rollback: reload all columns to restore correct state
        this.loadColumns(this.project!.id);

        this.snackBar.open('Failed to move task. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
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
      width: '420px',
      panelClass: 'linear-dialog'
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
      panelClass: 'linear-dialog',
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

  openEditTask(task: Task): void {
    const dialogRef = this.dialog.open(EditTaskDialogComponent, {
      width: '600px',
      panelClass: 'linear-dialog',
      data: { task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Edit Task - Form result:', result);

        this.taskService.updateTask(task.id, result).subscribe({
          next: (updatedTask) => {
            console.log('Edit Task - Backend response:', updatedTask);

            this.loadTasks(task.columnId);
            this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
          },
          error: (err) => {
            console.error('Failed to update task', err);
            this.snackBar.open('Failed to update task. Please try again.', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openMembersDialog(): void {
    this.dialog.open(MembersDialogComponent, {
      width: '600px',
      panelClass: 'linear-dialog',
      data: { projectId: this.project?.id }
    });
  }

  openTaskDetails(task: Task): void {
    const dialogRef = this.dialog.open(TaskDetailsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      panelClass: 'linear-dialog',
      data: {
        task,
        projectType: this.project?.type || 'PERSONAL',
        projectId: this.project?.id,
        allTasks: Object.values(this.tasksByColumn).flat()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.refreshNeeded) {
        this.loadTasks(task.columnId);
      }
    });
  }

  deleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete task "${task.title}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        const col = this.tasksByColumn[task.columnId];
        if (col) {
          this.tasksByColumn[task.columnId] = col.filter(t => t.id !== task.id);
        }
        this.snackBar.open('Task deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 })
    });
  }

  renameColumn(column: ProjectColumn): void {
    const newName = window.prompt('Rename column:', column.name);
    if (!newName || newName.trim() === column.name) return;

    this.columnService.updateColumn(column.id, { name: newName.trim() }).subscribe({
      next: () => {
        column.name = newName.trim();
        this.snackBar.open('Column renamed', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to rename column', 'Close', { duration: 3000 })
    });
  }

  deleteColumn(column: ProjectColumn): void {
    if (!confirm(`Delete column "${column.name}" and all its tasks?`)) return;

    this.columnService.deleteColumn(column.id).subscribe({
      next: () => {
        this.columns = this.columns.filter(c => c.id !== column.id);
        delete this.tasksByColumn[column.id];
        this.snackBar.open('Column deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to delete column', 'Close', { duration: 3000 })
    });
  }
}

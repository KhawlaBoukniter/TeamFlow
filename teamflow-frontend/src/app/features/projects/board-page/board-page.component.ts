import { Component, OnInit, inject, ViewChild } from '@angular/core';
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
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { ColumnService } from '../../../core/services/column.service';
import { TaskService } from '../../../core/services/task.service';
import { ChatService } from '../../../core/services/chat.service';
import { ExportService } from '../../../core/services/export.service';
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
import { ChatWindowComponent } from '../components/chat-window/chat-window.component';
import { AuditSidebarComponent } from '../components/audit-sidebar/audit-sidebar.component';
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
    MatTooltipModule,
    MatDividerModule,
    FormsModule,
    ChatWindowComponent,
    AuditSidebarComponent
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.css'
})
export class BoardPageComponent implements OnInit {
  project: Project | null = null;
  columns: ProjectColumn[] = [];
  tasksByColumn: { [key: number]: Task[] } = {};
  connectedTo: string[] = [];
  isLoading: boolean = true;

  @ViewChild('chatWindow') chatWindow!: ChatWindowComponent;
  @ViewChild('auditSidebar') auditSidebar!: AuditSidebarComponent;

  unreadCount: number = 0;

  get filteredAssignees() {
    if (!this.menuSearchQuery) return this.availableAssignees;
    const query = this.menuSearchQuery.toLowerCase();
    return this.availableAssignees.filter(u =>
      (u.name && u.name.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query)
    );
  }

  // Filtering
  searchQuery: string = '';
  menuSearchQuery: string = '';
  activeFilters = {
    priorities: [] as string[],
    assigneeIds: [] as number[],
    columnIds: [] as number[]
  };
  availableAssignees: any[] = [];

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private columnService = inject(ColumnService);
  private taskService = inject(TaskService);
  private chatService = inject(ChatService);
  private snackBar = inject(MatSnackBar);
  private exportService = inject(ExportService);

  constructor(public dialog: MatDialog) { }

  canManageProject(): boolean {
    if (!this.project || !this.authService.getCurrentUserId()) return false;
    const currentUserId = this.authService.getCurrentUserId();

    if (this.project.ownerId === currentUserId) return true;

    // Check membership role if available in project object (assuming team list is loaded)
    if (this.project.team) {
      return this.project.team.some((m: any) =>
        m.userId === currentUserId && m.roleInProject === 'MANAGER'
      );
    }
    return false;
  }

  canMoveTask(task: Task): boolean {
    if (this.canManageProject()) return true;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId || !task.assignments) return false;

    // Check if current user is an assignee
    return task.assignments.some(a => a.userId === currentUserId || Number(a.userId) === Number(currentUserId));
  }

  ngOnInit(): void {
    // Reactive route handling
    this.route.paramMap.subscribe(params => {
      const projectId = Number(params.get('id'));
      if (projectId) {
        this.loadProject(projectId);
        this.loadColumns(projectId);
      }
    });

    // Handle taskId from query params to auto-open task details
    this.route.queryParamMap.subscribe(params => {
      const taskId = params.get('taskId');
      if (taskId) {
        this.autoOpenTask(Number(taskId));
      }
    });

    // Listen for new messages to update badge if chat is closed
    this.chatService.newMessages$.subscribe(msg => {
      console.log('[DEBUG Chat] New message received:', msg);
      if (!msg || !this.project) return;

      if (!this.chatWindow?.isOpen) {
        // Only increment if message is from someone else
        if (msg.senderId !== this.authService.getCurrentUserId()) {
          console.log('[DEBUG Chat] Loading unread count for project:', this.project.id);
          this.loadUnreadCount(this.project.id);
        }
      } else {
        // If chat is open, only mark as read IF we are at the bottom
        if (this.chatWindow.isNearBottom) {
          console.log('[DEBUG Chat] Chat is open and at bottom, marking as read');
          this.unreadCount = 0;
          this.chatService.markAsRead(this.project.id).subscribe({
            next: () => console.log('[DEBUG Chat] Mark as read success'),
            error: (err) => console.error('[DEBUG Chat] Mark as read error:', err)
          });
        } else {
          console.log('[DEBUG Chat] Chat is open but scrolled up. Keeping as unread locally.');
        }
      }
    });
  }

  loadUnreadCount(projectId: number): void {
    this.chatService.getUnreadCount(projectId).subscribe({
      next: (res) => {
        console.log('[DEBUG Chat] Unread count loaded:', res.unreadCount);
        this.unreadCount = res.unreadCount;
      },
      error: (err) => {
        console.error('[DEBUG Chat] Failed to load unread count:', err);
        this.unreadCount = 0;
      }
    });
  }

  private connectChat(projectId: number): void {
    this.chatService.getChatRoom(projectId).subscribe({
      next: (room) => this.chatService.connect(room.id),
      error: (err) => console.error('Failed to connect chat in background', err)
    });
  }

  toggleChat(): void {
    if (!this.project) return;

    this.chatWindow.toggle();
    if (this.chatWindow.isOpen) {
      this.unreadCount = 0;
      this.chatService.markAsRead(this.project.id).subscribe();
    }
  }

  private autoOpenTask(taskId: number): void {
    // Wait for tasks to be loaded
    const checkTasks = setInterval(() => {
      const allTasks = Object.values(this.tasksByColumn).flat();
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        this.openTaskDetails(task);
        clearInterval(checkTasks);
      }
    }, 500);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkTasks), 5000);
  }

  loadProject(id: number): void {
    this.projectService.getProjectById(id).subscribe(p => {
      this.project = p;
      if (p.type === 'TEAM') {
        this.loadUnreadCount(p.id);
        this.connectChat(p.id);
      }
    });
  }

  exportTasks(): void {
    if (this.project) {
      this.exportService.exportTasks(this.project.id);
    }
  }

  loadColumns(projectId: number): void {
    this.isLoading = true;
    this.columnService.getColumnsByProject(projectId).subscribe({
      next: (cols) => {
        this.columns = cols.sort((a, b) => a.orderIndex - b.orderIndex);
        this.connectedTo = this.columns.map(c => `col-${c.id}`);
        this.columns.forEach(col => this.loadTasks(col.id));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load columns', err);
        this.snackBar.open('Failed to load board columns', 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  loadTasks(columnId: number): void {
    this.taskService.getTasksByColumn(columnId).subscribe({
      next: (tasks) => {
        this.tasksByColumn[columnId] = tasks.sort((a, b) => a.position - b.position);
        this.updateAvailableAssignees();
      },
      error: (err) => {
        console.error(`Failed to load tasks for column ${columnId}`, err);
        // Fallback to empty list to prevent UI breakage
        this.tasksByColumn[columnId] = [];
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
      }
    });
  }

  updateAvailableAssignees(): void {
    const assignees = new Map<number, any>();
    Object.values(this.tasksByColumn).flat().forEach(task => {
      task.assignments?.forEach(a => {
        const userId = Number(a.userId);
        if (!assignees.has(userId)) {
          assignees.set(userId, { id: userId, name: a.userName, email: a.userEmail });
        }
      });
    });
    this.availableAssignees = Array.from(assignees.values());
  }

  getTasks(columnId: number): Task[] {
    let tasks = this.tasksByColumn[columnId] || [];

    // Apply Column Filter (Global status filter)
    if (this.activeFilters.columnIds.length > 0) {
      if (!this.activeFilters.columnIds.includes(columnId)) {
        return []; // If this column is not in active filters, return no tasks for it
      }
    }

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
        t.assignments?.some(a => this.activeFilters.assigneeIds.includes(Number(a.userId)))
      );
    }

    return tasks;
  }

  toggleColumnFilter(columnId: number): void {
    const current = [...this.activeFilters.columnIds];
    const index = current.indexOf(columnId);
    if (index >= 0) {
      this.activeFilters = {
        ...this.activeFilters,
        columnIds: current.filter(id => id !== columnId)
      };
    } else {
      this.activeFilters = {
        ...this.activeFilters,
        columnIds: [...current, columnId]
      };
    }
  }

  isColumnSelected(columnId: number): boolean {
    return this.activeFilters.columnIds.includes(columnId);
  }

  togglePriorityFilter(priority: string): void {
    const current = [...this.activeFilters.priorities];
    const index = current.indexOf(priority);
    if (index >= 0) {
      this.activeFilters = {
        ...this.activeFilters,
        priorities: current.filter(p => p !== priority)
      };
    } else {
      this.activeFilters = {
        ...this.activeFilters,
        priorities: [...current, priority]
      };
    }
  }

  toggleAssigneeFilter(userId: any): void {
    const id = Number(userId);
    const current = [...this.activeFilters.assigneeIds];
    const index = current.indexOf(id);

    if (index >= 0) {
      this.activeFilters = {
        ...this.activeFilters,
        assigneeIds: current.filter(aId => aId !== id)
      };
    } else {
      this.activeFilters = {
        ...this.activeFilters,
        assigneeIds: [...current, id]
      };
    }
  }

  clearFilters(): void {
    this.activeFilters = {
      priorities: [],
      assigneeIds: [],
      columnIds: []
    };
    this.searchQuery = '';
  }

  get hasActiveFilters(): boolean {
    return this.activeFilters.priorities.length > 0 ||
      this.activeFilters.assigneeIds.length > 0 ||
      this.activeFilters.columnIds.length > 0 ||
      !!this.searchQuery;
  }

  isAssigneeSelected(userId: any): boolean {
    return this.activeFilters.assigneeIds.includes(Number(userId));
  }

  isPrioritySelected(priority: string): boolean {
    return this.activeFilters.priorities.includes(priority);
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
        // Refresh all columns because moving a task might unblock others
        this.loadColumns(this.project!.id);
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
    if (task.columnId === targetColumnId || task.columnId === undefined) return;

    const previousList = this.tasksByColumn[task.columnId];
    const targetList = this.tasksByColumn[targetColumnId] || [];

    if (previousList) {
      const index = previousList.findIndex((t: Task) => t.id === task.id);
      if (index !== -1) {
        previousList.splice(index, 1);
        targetList.push({ ...task, columnId: targetColumnId });
        this.tasksByColumn[targetColumnId] = targetList;
      }
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
          orderIndex: orderIndex,
          isFinal: result.isFinal
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
      data: {
        task,
        allTasks: Object.values(this.tasksByColumn).flat()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.refreshNeeded) {
          // If dependencies were changed inside the dialog
          this.loadColumns(this.project!.id);
          return;
        }

        console.log('Edit Task - Form result:', result);
        this.taskService.updateTask(task.id, result).subscribe({
          next: () => {
            this.loadColumns(this.project!.id); // Reload all to see blocked status updates elsewhere
            this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
          },
          error: (err) => {
            console.error('Failed to update task', err);
            this.snackBar.open('Failed to update task', 'Close', { duration: 5000 });
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
      if (result?.refreshNeeded && task.columnId !== undefined) {
        this.loadTasks(task.columnId);
      }
    });
  }

  deleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete task "${task.title}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        const columnId = task.columnId;
        if (columnId !== undefined) {
          const col = this.tasksByColumn[columnId];
          if (col) {
            this.tasksByColumn[columnId] = col.filter((t: Task) => t.id !== task.id);
          }
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

  getBlockingTooltip(task: Task): string {
    if (!task.blockingTasks || task.blockingTasks.length === 0) return 'Blocked';
    const titles = task.blockingTasks.map(t => `• ${t.title}`).join('\n');
    return `Waiting on:\n${titles}`;
  }
}

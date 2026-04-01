import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../shared/models';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './my-issues.component.html'
})
export class MyIssuesComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;

  searchQuery = '';
  activeFilters = {
    priorities: [] as string[],
    projects: [] as string[]
  };

  private taskService = inject(TaskService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadMyTasks();
  }

  loadMyTasks(): void {
    this.loading = true;
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredTasks(): Task[] {
    let filtered = this.tasks;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    if (this.activeFilters.priorities.length > 0) {
      filtered = filtered.filter(t => this.activeFilters.priorities.includes(t.priority));
    }

    if (this.activeFilters.projects.length > 0) {
      filtered = filtered.filter(t => this.activeFilters.projects.includes(t.projectName || 'Unassigned'));
    }

    return filtered;
  }

  get groupedFilteredTasks(): { [key: string]: Task[] } {
    return this.filteredTasks.reduce((groups, task) => {
      const projectName = task.projectName || 'Unassigned';
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(task);
      return groups;
    }, {} as { [key: string]: Task[] });
  }

  get availableProjects(): string[] {
    const projects = new Set<string>();
    this.tasks.forEach(t => projects.add(t.projectName || 'Unassigned'));
    return Array.from(projects).sort();
  }

  get hasActiveFilters(): boolean {
    return this.activeFilters.priorities.length > 0 || this.activeFilters.projects.length > 0 || !!this.searchQuery;
  }

  togglePriority(p: string): void {
    const idx = this.activeFilters.priorities.indexOf(p);
    if (idx >= 0) {
      this.activeFilters.priorities.splice(idx, 1);
    } else {
      this.activeFilters.priorities.push(p);
    }
  }

  isPrioritySelected(p: string): boolean {
    return this.activeFilters.priorities.includes(p);
  }

  toggleProject(p: string): void {
    const idx = this.activeFilters.projects.indexOf(p);
    if (idx >= 0) {
      this.activeFilters.projects.splice(idx, 1);
    } else {
      this.activeFilters.projects.push(p);
    }
  }

  isProjectSelected(p: string): boolean {
    return this.activeFilters.projects.includes(p);
  }

  clearFilters(): void {
    this.activeFilters = { priorities: [], projects: [] };
    this.searchQuery = '';
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'HIGH':
      case 'URGENT': return 'keyboard_double_arrow_up';
      case 'MEDIUM': return 'keyboard_arrow_up';
      default: return 'keyboard_arrow_down';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
      case 'URGENT': return 'text-red-400';
      case 'MEDIUM': return 'text-amber-400';
      default: return 'text-blue-400';
    }
  }

  isOverdue(date: string): boolean {
    return new Date(date) < new Date();
  }

  openBoard(task: Task): void {
    if (task.projectId) {
      this.router.navigate(['/projects', task.projectId, 'board']);
    }
  }
}

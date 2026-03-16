import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../shared/models';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="h-full flex flex-col bg-[#09090b] page-enter overflow-hidden">
      <!-- Header -->
      <div class="h-16 shrink-0 border-b border-[#1C1C1E] px-8 flex items-center justify-between bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
            <mat-icon class="text-[#5E6AD2] !text-[20px]">adjust</mat-icon>
          </div>
          <h1 class="text-[15px] font-bold text-white tracking-tight">My Issues</h1>
          <span class="px-2 py-0.5 rounded-full bg-[#1C1C1E] border border-[#2E3035] text-[10px] font-bold text-[#8A8F98] ml-2">
            {{ tasks.length }}
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button mat-icon-button class="!text-[#8A8F98] hover:!text-white transition-colors">
            <mat-icon class="!text-[20px]">filter_list</mat-icon>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="space-y-4">
          <div *ngFor="let i of [1,2,3,4,5]" class="h-14 bg-[#111113] border border-[#1C1C1E] rounded-xl animate-pulse"></div>
        </div>

        <!-- Task List -->
        <div *ngIf="!loading && tasks.length > 0" class="space-y-8">
          <div *ngFor="let group of groupedTasks | keyvalue" class="space-y-3">
            <div class="flex items-center gap-2 px-1">
              <mat-icon class="!text-[14px] !w-3.5 !h-3.5 text-[#5E6AD2]">folder_special</mat-icon>
              <h2 class="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-[0.1em]">{{ group.key }}</h2>
            </div>

            <div class="bg-[#111113] border border-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
              <div *ngFor="let task of group.value; let last = last" 
                   (click)="openBoard(task)"
                   class="group flex items-center gap-5 px-5 py-3.5 hover:bg-[#1A1A1D] transition-all cursor-pointer border-b border-[#1C1C1E] last:border-0"
                   [ngClass]="{'opacity-70': task.isCompleted}">
                
                <!-- Priority Icon -->
                <div class="shrink-0 flex items-center justify-center transition-all duration-300" 
                     [ngClass]="task.isCompleted ? 'opacity-30 grayscale scale-90' : getPriorityClass(task.priority)">
                  <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">
                    {{ task.isCompleted ? 'verified' : getPriorityIcon(task.priority) }}
                  </mat-icon>
                </div>

                <!-- Task Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[13px] font-semibold transition-colors truncate"
                          [ngClass]="task.isCompleted ? 'text-[#4A4B4E] line-through decoration-[#3A3C42]' : 'text-[#EDEDED] group-hover:text-white'">
                      {{ task.title }}
                    </span>
                    <span *ngIf="task.blocked && !task.isCompleted" class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <mat-icon class="!text-[10px] !w-[10px] !h-[10px]">lock</mat-icon>
                      Blocked
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] font-bold uppercase tracking-wider" 
                          [ngClass]="task.isCompleted ? 'text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10' : 'text-[#5E6AD2]'">
                      {{ task.isCompleted ? 'Done' : (task.columnName || 'Active') }}
                    </span>
                    <span class="w-1 h-1 rounded-full bg-[#2E3035]"></span>
                    <span class="text-[11px] transition-colors" [ngClass]="task.isCompleted ? 'text-[#3A3C42] line-through decoration-[#3A3C42]' : 'text-[#8A8F98]'">
                      {{ (task.description || '') | slice:0:60 }}{{ (task.description && task.description.length > 60) ? '...' : '' }}
                    </span>
                  </div>
                </div>

                <!-- Metadata -->
                <div class="shrink-0 flex items-center gap-6">
                  <!-- Due Date -->
                  <div *ngIf="task.dueDate && !task.isCompleted" class="flex flex-col items-end">
                    <span class="text-[10px] text-[#3A3C42] uppercase tracking-wider font-bold mb-0.5">Due</span>
                    <span class="text-[11px] font-medium" [ngClass]="isOverdue(task.dueDate) ? 'text-red-400' : 'text-[#8A8F98]'">
                      {{ task.dueDate | date:'MMM d' }}
                    </span>
                  </div>

                  <div *ngIf="task.isCompleted" class="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                     <mat-icon class="!text-[12px] !w-3 !h-3 text-emerald-500">check</mat-icon>
                     <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Finished</span>
                  </div>

                  <!-- Navigation Arrow -->
                  <mat-icon class="!text-[18px] !w-[18px] !h-[18px] text-[#2E3035] group-hover:text-[#5E6AD2] transition-colors">
                    chevron_right
                  </mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && tasks.length === 0" class="flex flex-col items-center justify-center text-center py-20">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1C1C1E] to-[#111113] border border-[#2E3035] flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-[#5E6AD2]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <mat-icon class="!text-[40px] !w-10 !h-10 text-[#3A3C42] group-hover:text-[#5E6AD2] transition-colors">check_circle_outline</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">You're all caught up!</h2>
          <p class="text-[13px] text-[#8A8F98] max-w-sm leading-relaxed">
            No issues assigned to you. When tasks are assigned, they'll show up here for centralized tracking.
          </p>
          <button routerLink="/projects" class="mt-8 px-6 py-2.5 bg-[#1C1C1E] hover:bg-[#25262B] text-white text-[13px] font-medium rounded-xl border border-[#2E3035] transition-all active:scale-[0.98]">
            Browse Projects
          </button>
        </div>
      </div>
    </div>
  `
})
export class MyIssuesComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  groupedTasks: { [key: string]: Task[] } = {};

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
        this.groupTasks(tasks);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  groupTasks(tasks: Task[]): void {
    this.groupedTasks = tasks.reduce((groups, task) => {
      const projectName = task.projectName || 'Unassigned';
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(task);
      return groups;
    }, {} as { [key: string]: Task[] });
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

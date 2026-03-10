import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { Project, Task } from '../../shared/models';
import { ProjectCreateDialogComponent } from '../projects/components/project-create-dialog/project-create-dialog.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatDialogModule,
    ],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
    projects: Project[] = [];
    myTasks: Task[] = [];
    loading = true;

    private projectService = inject(ProjectService);
    private authService = inject(AuthService);
    private taskService = inject(TaskService);
    private router = inject(Router);
    private dialog = inject(MatDialog);

    get userEmail(): string {
        return this.authService.getUserEmail() || 'there';
    }

    get firstName(): string {
        return this.userEmail.split('@')[0];
    }

    get greeting(): string {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 18) return 'afternoon';
        return 'evening';
    }

    get activeProjects(): Project[] {
        return this.projects.filter(p => p.status === 'ACTIVE');
    }

    get overdueProjects(): Project[] {
        const now = new Date();
        return this.projects.filter(p =>
            p.status === 'ACTIVE' && p.endDate && new Date(p.endDate) < now
        );
    }

    get archivedCount(): number {
        return this.projects.filter(p => p.status === 'ARCHIVED').length;
    }

    get totalTasks(): number {
        return this.projects.reduce((sum, p) => sum + (p.totalTasks || 0), 0);
    }

    get completedTasks(): number {
        return this.projects.reduce((sum, p) => sum + (p.completedTasks || 0), 0);
    }

    get globalProgress(): number {
        if (!this.totalTasks) return 0;
        return Math.round((this.completedTasks / this.totalTasks) * 100);
    }

    get topProjects(): Project[] {
        const now = new Date();
        return [...this.activeProjects]
            .filter(p => !p.endDate || new Date(p.endDate) >= now)
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 3);
    }

    get recentTasks(): Task[] {
        const now = new Date();
        return [...this.myTasks]
            .filter(t => !t.dueDate || new Date(t.dueDate) >= now)
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 3);
    }

    ngOnInit(): void {
        this.projectService.getAllProjects().subscribe({
            next: (data) => {
                this.projects = data;

                // Fetch my active tasks after projects to keep loading state unified
                this.taskService.getMyTasks().subscribe({
                    next: (tasks) => {
                        this.myTasks = tasks;
                        this.loading = false;
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
            },
            error: () => { this.loading = false; }
        });
    }

    openProject(id: number): void {
        this.router.navigate(['/projects', id, 'board']);
    }

    openCreateDialog(): void {
        const ref = this.dialog.open(ProjectCreateDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            disableClose: true,
            panelClass: 'linear-dialog'
        });
        ref.afterClosed().subscribe(result => {
            if (result) this.ngOnInit();
        });
    }

    getProgress(p: Project): number {
        return Math.round(p.progress || 0);
    }

    getProgressColor(p: Project): string {
        const v = this.getProgress(p);
        if (v === 100) return '#03D59D';
        if (v < 30) return '#FEAD69';
        if (v < 70) return '#5E6AD2';
        return '#03D59D';
    }

    getDaysLeft(p: Project): string {
        if (!p.endDate) return '';
        const diff = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Due today';
        return `${diff}d left`;
    }

    isOverdue(p: Project): boolean {
        return !!p.endDate && new Date(p.endDate) < new Date();
    }

    getTaskDaysLeft(t: Task): string {
        if (!t.dueDate) return '';
        const diff = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000);
        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Due today';
        return `${diff}d left`;
    }

    isTaskOverdue(t: Task): boolean {
        return !!t.dueDate && new Date(t.dueDate) < new Date();
    }
}

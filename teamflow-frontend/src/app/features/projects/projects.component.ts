import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { ExportService } from '../../core/services/export.service';
import { Project } from '../../shared/models';
import { ProjectCreateDialogComponent } from './components/project-create-dialog/project-create-dialog.component';
import { ProjectEditDialogComponent } from './components/project-edit-dialog/project-edit-dialog.component';
import { ProjectDetailsDialogComponent } from './components/project-details-dialog/project-details-dialog.component';
import { MembersDialogComponent } from './components/members-dialog/members-dialog.component';
import { BRANDING } from '../../core/constants/branding';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, MatProgressSpinnerModule, MatMenuModule, MatDividerModule, MatSnackBarModule, MatTooltipModule],
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
    readonly BRANDING = BRANDING;

    userEmail: string | null;
    projects: Project[] = [];
    loading = false;
    private currentUserId: number | null = null;

    protected authService = inject(AuthService);
    private projectService = inject(ProjectService);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private exportService = inject(ExportService);

    viewMode: 'grid' | 'list' = 'grid';
    searchTerm = '';
    showArchived = false;

    constructor() {
        this.userEmail = this.authService.getUserEmail();
        this.currentUserId = this.authService.getCurrentUserId();
    }

    ngOnInit(): void {
        this.loadProjects();
    }

    loadProjects(): void {
        this.loading = true;
        this.projectService.getAllProjects().subscribe({
            next: (data) => {
                this.projects = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading projects', err);
                this.loading = false;
            }
        });
    }

    toggleArchivedVisibility(): void {
        this.showArchived = !this.showArchived;
    }

    setViewMode(mode: 'grid' | 'list'): void {
        this.viewMode = mode;
    }

    get filteredProjects(): Project[] {
        let filtered = this.projects;

        // Archive Filter
        if (!this.showArchived) {
            filtered = filtered.filter(p => p.status === 'ACTIVE');
        }

        // Search Filter
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }

    get upcomingProjectsCount(): number {
        const now = new Date();
        return this.projects.filter(p => p.startDate && new Date(p.startDate) > now).length;
    }

    getProjectProgress(project: Project): number {
        return Math.round(project.progress || 0);
    }

    getDaysLeft(project: Project): string {
        if (!project.endDate) return '';
        const end = new Date(project.endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Today';
        return `${diff} Days Left`;
    }

    getProgressBarColor(project: Project): string {
        const progress = this.getProjectProgress(project);
        if (progress === 100) return '#03D59D';
        if (progress < 30) return '#FEAD69';
        if (progress < 70) return '#5E6AD2';
        return '#03D59D';
    }

    /**
     * Returns true if the current user can manage (edit/archive/delete) the project.
     * A user can manage if they are the owner OR a MANAGER member.
     */
    canManageProject(project: Project): boolean {
        // Admins are supervisors (read-only) unless they are specifically owners/managers
        if (!this.currentUserId) return false;

        // If user is owner, they can manage
        if (project.ownerId === this.currentUserId) return true;

        // If user is a MANAGER in the team
        if (project.team) {
            const isManager = project.team.some((m: any) =>
                m.userId === this.currentUserId && m.roleInProject === 'MANAGER'
            );
            if (isManager) return true;
        }

        return false;
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ProjectCreateDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            disableClose: true,
            panelClass: 'linear-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.projects.push(result);
                this.loadProjects();
            }
        });
    }

    openProject(id: number): void {
        this.router.navigate(['/projects', id, 'board']);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    exportToCsv(): void {
        this.exportService.exportProjects();
    }

    get activeProjectsCount(): number {
        return this.projects.filter(p => p.status === 'ACTIVE').length;
    }

    get totalProjectsCount(): number {
        return this.projects.length;
    }

    openProjectDetails(project: Project): void {
        const dialogRef = this.dialog.open(ProjectDetailsDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            data: { project },
            panelClass: 'linear-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.refreshNeeded) {
                this.loadProjects();
            }
        });
    }

    openMembersDialog(project: Project, event: Event): void {
        event.stopPropagation();

        this.dialog.open(MembersDialogComponent, {
            width: '600px',
            maxHeight: '90vh',
            data: { projectId: project.id },
            panelClass: 'linear-dialog'
        });
    }

    openProjectEdit(project: Project): void {
        const dialogRef = this.dialog.open(ProjectEditDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            data: { project },
            panelClass: 'linear-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadProjects();
            }
        });
    }

    archiveProject(project: Project): void {
        if (confirm(`Archive project "${project.name}"?`)) {
            this.projectService.updateProject(project.id, { ...project, status: 'ARCHIVED' }).subscribe({
                next: () => {
                    this.loadProjects();
                    this.snackBar.open('Project archived', 'Close', { duration: 2000 });
                },
                error: (err) => {
                    console.error('Failed to archive project', err);
                    this.snackBar.open('Failed to archive project', 'Close', { duration: 3000 });
                }
            });
        }
    }

    unarchiveProject(project: Project): void {
        this.projectService.updateProject(project.id, { ...project, status: 'ACTIVE' }).subscribe({
            next: () => {
                this.loadProjects();
                this.snackBar.open('Project unarchived', 'Close', { duration: 2000 });
            },
            error: (err) => {
                console.error('Failed to unarchive project', err);
                this.snackBar.open('Failed to unarchive project', 'Close', { duration: 3000 });
            }
        });
    }

    deleteProject(project: Project): void {
        if (confirm(`Delete project "${project.name}"? This action cannot be undone.`)) {
            this.projectService.deleteProject(project.id).subscribe({
                next: () => {
                    this.loadProjects();
                    this.snackBar.open('Project deleted', 'Close', { duration: 2000 });
                },
                error: (err) => {
                    console.error('Failed to delete project', err);
                    this.snackBar.open('Failed to delete project', 'Close', { duration: 3000 });
                }
            });
        }
    }
}

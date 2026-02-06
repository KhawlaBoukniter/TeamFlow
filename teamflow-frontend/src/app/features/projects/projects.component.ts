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
import { Project } from '../../shared/models';
import { ProjectCreateDialogComponent } from './components/project-create-dialog/project-create-dialog.component';
import { ProjectEditDialogComponent } from './components/project-edit-dialog/project-edit-dialog.component';
import { ProjectDetailsDialogComponent } from './components/project-details-dialog/project-details-dialog.component';
import { BRANDING } from '../../core/constants/branding';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, MatProgressSpinnerModule, MatMenuModule, MatDividerModule, MatSnackBarModule],
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
    readonly BRANDING = BRANDING;

    userEmail: string | null;
    projects: Project[] = [];
    loading = false;

    private authService = inject(AuthService);
    private projectService = inject(ProjectService);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    constructor() {
        this.userEmail = this.authService.getUserEmail();
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

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ProjectCreateDialogComponent, {
            width: '600px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Project created successfully, append to list or reload
                this.projects.push(result);
                // Ideally reload to get sync state
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

    get activeProjectsCount(): number {
        return this.projects.filter(p => p.status === 'ACTIVE').length;
    }

    get totalProjectsCount(): number {
        return this.projects.length;
    }

    openProjectDetails(project: Project): void {
        const dialogRef = this.dialog.open(ProjectDetailsDialogComponent, {
            width: '700px',
            maxHeight: '90vh',
            data: { project }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.refreshNeeded) {
                this.loadProjects();
            }
        });
    }

    openProjectEdit(project: Project): void {
        const dialogRef = this.dialog.open(ProjectEditDialogComponent, {
            width: '600px',
            data: { project }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadProjects();
            }
        });
    }

    archiveProject(project: Project): void {
        if (confirm(`Archive project "${project.name}"?`)) {
            this.projectService.updateProject(project.id, { status: 'ARCHIVED' }).subscribe({
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
        this.projectService.updateProject(project.id, { status: 'ACTIVE' }).subscribe({
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

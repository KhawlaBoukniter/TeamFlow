import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../shared/models';
import { ProjectCreateDialogComponent } from './components/project-create-dialog/project-create-dialog.component';
import { BRANDING } from '../../core/constants/branding';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, MatProgressSpinnerModule],
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
}

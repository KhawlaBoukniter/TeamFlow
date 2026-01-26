import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
    templateUrl: './projects.component.html'
})
export class ProjectsComponent {
    userEmail: string | null;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {
        this.userEmail = this.authService.getUserEmail();
    }

    logout(): void {
        this.authService.logout();
    }
}

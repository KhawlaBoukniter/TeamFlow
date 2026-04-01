import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommandPaletteComponent } from '../../../shared/components/command-palette/command-palette.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { BRANDING } from '../../constants/branding';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  readonly BRANDING = BRANDING;
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  private dialog = inject(MatDialog);

  unreadCount$ = this.notificationService.unreadCount$;

  ngOnInit() {
    this.notificationService.refreshUnreadCount();
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'User';
  }

  get workspaceName(): string {
    const email = this.userEmail;
    return (email.split('@')[0] || 'My Workspace') + "'s Team";
  }

  logout(): void {
    this.authService.logout();
  }

  openSearch() {
    this.dialog.open(CommandPaletteComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'command-palette-dialog',
      backdropClass: 'command-palette-backdrop'
    });
  }
}

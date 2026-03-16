import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommandPaletteComponent } from '../../../shared/components/command-palette/command-palette.component';
import { inject, HostListener } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, MatDialogModule],
  template: `
    <div class="flex h-screen w-full bg-[#121214] text-white font-sans overflow-hidden">
      <!-- Sidebar (Fixed width) -->
      <app-sidebar class="w-[240px] shrink-0 h-full z-20"></app-sidebar>

      <!-- Main Content Area: scrolling is handled by each page -->
      <main class="flex-1 h-full overflow-hidden flex flex-col relative min-w-0">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class MainLayoutComponent {
  private dialog = inject(MatDialog);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  openSearch() {
    // Prevent multiple instances
    if (this.dialog.openDialogs.length > 0) return;

    this.dialog.open(CommandPaletteComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'command-palette-dialog',
      backdropClass: 'command-palette-backdrop'
    });
  }
}

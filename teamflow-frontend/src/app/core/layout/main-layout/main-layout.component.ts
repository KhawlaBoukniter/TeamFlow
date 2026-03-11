import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
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
export class MainLayoutComponent { }

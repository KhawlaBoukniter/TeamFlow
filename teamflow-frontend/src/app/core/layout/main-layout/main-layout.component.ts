import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
    <div class="flex h-screen w-full bg-[#f4f5f8]">
      <!-- Sidebar (Fixed width) -->
      <app-sidebar class="w-64 shrink-0 h-full border-r border-slate-200 shadow-sm z-20"></app-sidebar>
      
      <!-- Main Content Area -->
      <main class="flex-1 h-full overflow-hidden flex flex-col relative text-slate-800">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class MainLayoutComponent { }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule],
    templateUrl: './home.component.html',
    styles: [`
    @keyframes slow-rotate {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .animate-slow-rotate {
      animation: slow-rotate 15s linear infinite;
    }
  `]
})
export class HomeComponent { }

import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

@Component({
    selector: 'app-command-palette',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    template: `
    <div class="command-palette-container bg-[#1C1C1E] border border-[#2E3035] rounded-xl shadow-2xl overflow-hidden w-[600px] max-w-[90vw]">
      <!-- Search Input -->
      <div class="flex items-center px-4 py-4 border-b border-[#2E3035]">
        <mat-icon class="text-[#8A8F98] mr-3">search</mat-icon>
        <input [(ngModel)]="query" 
               (ngModelChange)="onQueryChange($event)"
               placeholder="Search projects, tasks, or users..."
               class="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder-[#8A8F98]"
               #searchInput
               autofocus>
        <div class="px-2 py-1 rounded bg-[#25262B] text-[10px] text-[#8A8F98] font-mono">ESC</div>
      </div>

      <!-- Results Area -->
      <div class="max-h-[400px] overflow-y-auto py-2">
        <div *ngIf="loading" class="px-4 py-8 text-center text-[#8A8F98]">
          <div class="animate-pulse">Searching...</div>
        </div>

        <div *ngIf="!loading && results.length === 0 && query.length >= 2" class="px-4 py-8 text-center text-[#8A8F98]">
          No results found for "{{ query }}"
        </div>

        <div *ngIf="query.length < 2 && results.length === 0" class="px-4 py-8 text-center text-[#8A8F98]">
           Type at least 2 characters to search...
        </div>

        <!-- Result Items -->
        <div *ngFor="let result of results; let i = index" 
             (click)="navigateTo(result)"
             [class.bg-[#25262B]]="selectedIndex === i"
             class="flex items-center px-4 py-3 cursor-pointer hover:bg-[#25262B] transition-colors group">
          
          <div [ngSwitch]="result.type" class="w-8 h-8 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-transform group-hover:scale-110">
            <mat-icon *ngSwitchCase="'PROJECT'" class="text-blue-400">dns</mat-icon>
            <mat-icon *ngSwitchCase="'TASK'" class="text-emerald-400">task_alt</mat-icon>
            <mat-icon *ngSwitchCase="'USER'" class="text-purple-400">person</mat-icon>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-medium truncate">{{ result.title }}</div>
            <div class="text-[#8A8F98] text-[11px] truncate">{{ result.subtitle }}</div>
          </div>

          <mat-icon class="text-[#8A8F98] opacity-0 group-hover:opacity-100 transition-opacity !text-[16px]">arrow_forward</mat-icon>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 bg-[#121214] border-t border-[#2E3035] flex items-center gap-4 text-[10px] text-[#8A8F98]">
        <div class="flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded bg-[#25262B] font-mono">↑↓</span>
          <span>to navigate</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded bg-[#25262B] font-mono">↵</span>
          <span>to open</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; border-radius: 12px; }
    input::placeholder { color: #8A8F98; }
  `]
})
export class CommandPaletteComponent implements OnInit {
    query = '';
    results: SearchResult[] = [];
    loading = false;
    selectedIndex = 0;

    private searchService = inject(SearchService);
    private dialogRef = inject(MatDialogRef<CommandPaletteComponent>);
    private router = inject(Router);
    private querySubject = new Subject<string>();

    ngOnInit() {
        this.querySubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(q => {
                if (q.length < 2) {
                    this.loading = false;
                    return of([]);
                }
                this.loading = true;
                return this.searchService.search(q);
            })
        ).subscribe({
            next: (results) => {
                this.results = results;
                this.loading = false;
                this.selectedIndex = 0;
            },
            error: () => {
                this.loading = false;
                this.results = [];
            }
        });
    }

    onQueryChange(q: string) {
        this.querySubject.next(q);
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
        } else if (event.key === 'Enter') {
            if (this.results[this.selectedIndex]) {
                this.navigateTo(this.results[this.selectedIndex]);
            }
        }
    }

    navigateTo(result: SearchResult) {
        this.router.navigateByUrl(result.link);
        this.dialogRef.close();
    }
}

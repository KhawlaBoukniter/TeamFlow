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
    templateUrl: './command-palette.component.html',
    styleUrl: './command-palette.component.css'
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

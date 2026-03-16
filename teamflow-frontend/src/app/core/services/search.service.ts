import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchResult {
    type: 'PROJECT' | 'TASK' | 'USER';
    id: number;
    title: string;
    subtitle: string;
    link: string;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private apiUrl = `${environment.apiUrl}/search`;
    private http = inject(HttpClient);

    search(query: string): Observable<SearchResult[]> {
        const params = new HttpParams().set('q', query);
        return this.http.get<SearchResult[]>(this.apiUrl, { params });
    }
}

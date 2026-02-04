import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectColumn } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class ColumnService {
    private apiUrl = `${environment.apiUrl}/columns`;
    private http = inject(HttpClient);

    getColumnsByProject(projectId: number): Observable<ProjectColumn[]> {
        return this.http.get<ProjectColumn[]>(`${environment.apiUrl}/projects/${projectId}/columns`);
    }

    createColumn(projectId: number, column: Partial<ProjectColumn>): Observable<ProjectColumn> {
        return this.http.post<ProjectColumn>(`${environment.apiUrl}/projects/${projectId}/columns`, column);
    }

    updateColumn(id: number, column: Partial<ProjectColumn>): Observable<ProjectColumn> {
        return this.http.put<ProjectColumn>(`${this.apiUrl}/${id}`, column);
    }

    deleteColumn(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

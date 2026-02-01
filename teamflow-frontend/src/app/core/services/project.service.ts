import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private apiUrl = `${environment.apiUrl}/projects`;
    private http = inject(HttpClient);

    getAllProjects(): Observable<Project[]> {
        return this.http.get<Project[]>(this.apiUrl);
    }

    getProjectById(id: number): Observable<Project> {
        return this.http.get<Project>(`${this.apiUrl}/${id}`);
    }

    createProject(project: Partial<Project>): Observable<Project> {
        const payload: any = { ...project };
        if (payload.startDate && payload.startDate instanceof Date) {
            payload.startDate = payload.startDate.toISOString().split('T')[0];
        }
        if (payload.endDate && payload.endDate instanceof Date) {
            payload.endDate = payload.endDate.toISOString().split('T')[0];
        }
        return this.http.post<Project>(this.apiUrl, payload);
    }

    updateProject(id: number, project: Partial<Project>): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
    }

    deleteProject(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

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

        // Format dates to yyyy-MM-dd
        if (payload.startDate && payload.startDate instanceof Date) {
            payload.startDate = payload.startDate.toISOString().split('T')[0];
        } else if (!payload.startDate) {
            delete payload.startDate;
        }

        if (payload.endDate && payload.endDate instanceof Date) {
            payload.endDate = payload.endDate.toISOString().split('T')[0];
        } else if (!payload.endDate) {
            delete payload.endDate;
        }

        // Remove empty description if present
        if (!payload.description) {
            delete payload.description;
        }

        // Ensure defaults if missing (defense in depth)
        if (!payload.status) payload.status = 'ACTIVE';
        if (!payload.type) payload.type = 'PERSONAL';

        console.log('Sending Project Payload:', payload);
        return this.http.post<Project>(this.apiUrl, payload);
    }

    updateProject(id: number, project: Partial<Project>): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
    }

    deleteProject(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaskAssignment {
    id: number;
    taskId: number;
    userId: number;
    roleInTask?: string;
    assignedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AssignmentService {
    private apiUrl = `${environment.apiUrl}/assignments`;
    private http = inject(HttpClient);

    getAssignmentsByTask(taskId: number): Observable<TaskAssignment[]> {
        return this.http.get<TaskAssignment[]>(`${this.apiUrl}/task/${taskId}`);
    }

    assignUser(assignment: Partial<TaskAssignment>): Observable<TaskAssignment> {
        return this.http.post<TaskAssignment>(this.apiUrl, assignment);
    }

    updateAssignment(id: number, assignment: Partial<TaskAssignment>): Observable<TaskAssignment> {
        return this.http.put<TaskAssignment>(`${this.apiUrl}/${id}`, assignment);
    }

    removeAssignment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

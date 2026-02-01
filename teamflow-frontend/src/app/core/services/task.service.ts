import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = `${environment.apiUrl}/tasks`;
    private http = inject(HttpClient);

    getTasksByColumn(columnId: number): Observable<Task[]> {
        return this.http.get<Task[]>(`${environment.apiUrl}/tasks/column/${columnId}`);
    }

    getTaskById(id: number): Observable<Task> {
        return this.http.get<Task>(`${this.apiUrl}/${id}`);
    }

    createTask(columnId: number, task: Partial<Task>): Observable<Task> {
        const payload: any = { ...task };

        // Sanitize payload
        if (payload.dueDate && payload.dueDate instanceof Date) {
            payload.dueDate = payload.dueDate.toISOString().split('T')[0];
        } else if (!payload.dueDate) {
            delete payload.dueDate;
        }

        if (!payload.description) {
            delete payload.description;
        }

        return this.http.post<Task>(`${environment.apiUrl}/columns/${columnId}/tasks`, payload);
    }

    updateTask(id: number, task: Partial<Task>): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
    }

    deleteTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    moveTask(taskId: number, targetColumnId: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${taskId}/move`, null, {
            params: { targetColumnId: targetColumnId.toString() }
        });
    }
}

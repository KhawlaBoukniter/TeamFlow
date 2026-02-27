import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskAssignment } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = `${environment.apiUrl}/tasks`;
    private http = inject(HttpClient);

    getTasksByColumn(columnId: number): Observable<Task[]> {
        return this.http.get<Task[]>(`${environment.apiUrl}/columns/${columnId}/tasks`);
    }

    getTaskById(id: number): Observable<Task> {
        return this.http.get<Task>(`${this.apiUrl}/${id}`);
    }

    getMyTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(`${environment.apiUrl}/dashboard/my-tasks`);
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
        return this.http.put<void>(`${this.apiUrl}/${taskId}/move`, null, {
            params: { targetColumnId: targetColumnId.toString() }
        });
    }

    assignMember(taskId: number, userId: number, role: 'RESPONSABLE' | 'CONTRIBUTOR' | 'OBSERVER'): Observable<TaskAssignment> {
        return this.http.post<TaskAssignment>(`${this.apiUrl}/${taskId}/assignments`, {
            userId,
            roleInTask: role
        });
    }

    removeAssignment(taskId: number, userId: number): Observable<void> {
        // Assuming there's an endpoint to remove by userId for a specific task
        // Or we might need to look up the assignment ID first. 
        // Based on typical REST: DELETE /tasks/{taskId}/assignments/{userId} OR DELETE /assignments/{id}
        // Let's assume standard sub-resource pattern for now, can adjust if backend differs.
        return this.http.delete<void>(`${this.apiUrl}/${taskId}/assignments/${userId}`);
    }

    addDependency(taskId: number, dependencyId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${taskId}/dependencies/${dependencyId}`, {});
    }

    removeDependency(taskId: number, dependencyId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${taskId}/dependencies/${dependencyId}`);
    }
}

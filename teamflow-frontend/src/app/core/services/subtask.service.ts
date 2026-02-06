import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubTask } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class SubTaskService {
    private apiUrl = `${environment.apiUrl}`;
    private http = inject(HttpClient);

    getSubTasksByTask(taskId: number): Observable<SubTask[]> {
        return this.http.get<SubTask[]>(`${this.apiUrl}/tasks/${taskId}/subtasks`);
    }

    createSubTask(taskId: number, subTask: Partial<SubTask>): Observable<SubTask> {
        return this.http.post<SubTask>(`${this.apiUrl}/tasks/${taskId}/subtasks`, subTask);
    }

    updateSubTask(id: number, subTask: Partial<SubTask>): Observable<SubTask> {
        return this.http.put<SubTask>(`${this.apiUrl}/subtasks/${id}`, subTask);
    }

    deleteSubTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/subtasks/${id}`);
    }
}

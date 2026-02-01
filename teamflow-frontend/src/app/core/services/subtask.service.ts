import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubTask } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class SubTaskService {
    private apiUrl = `${environment.apiUrl}/subtasks`;
    private http = inject(HttpClient);

    getSubTasksByTask(taskId: number): Observable<SubTask[]> {
        return this.http.get<SubTask[]>(`${this.apiUrl}/task/${taskId}`);
    }

    createSubTask(subTask: Partial<SubTask>): Observable<SubTask> {
        return this.http.post<SubTask>(this.apiUrl, subTask);
    }

    updateSubTask(id: number, subTask: Partial<SubTask>): Observable<SubTask> {
        return this.http.put<SubTask>(`${this.apiUrl}/${id}`, subTask);
    }

    deleteSubTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

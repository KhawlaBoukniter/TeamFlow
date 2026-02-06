import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private apiUrl = `${environment.apiUrl}`;
    private http = inject(HttpClient);

    getCommentsByTask(taskId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
    }

    createComment(taskId: number, userId: number, comment: Partial<Comment>): Observable<Comment> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.post<Comment>(`${this.apiUrl}/tasks/${taskId}/comments`, comment, { params });
    }

    updateComment(id: number, comment: Partial<Comment>): Observable<Comment> {
        return this.http.put<Comment>(`${this.apiUrl}/comments/${id}`, comment);
    }

    deleteComment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
    }
}

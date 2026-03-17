import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class AttachmentService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    upload(taskId: number, file: File): Observable<HttpEvent<Attachment>> {
        const formData: FormData = new FormData();
        formData.append('file', file);

        const req = new HttpRequest('POST', `${this.apiUrl}/tasks/${taskId}/attachments`, formData, {
            reportProgress: true,
            responseType: 'json'
        });

        return this.http.request(req);
    }

    uploadChatMessageAttachment(messageId: number, file: File): Observable<HttpEvent<Attachment>> {
        const formData: FormData = new FormData();
        formData.append('file', file);

        const req = new HttpRequest('POST', `${this.apiUrl}/chat/messages/${messageId}/attachments`, formData, {
            reportProgress: true,
            responseType: 'json'
        });

        return this.http.request(req);
    }

    getAttachments(taskId: number): Observable<Attachment[]> {
        return this.http.get<Attachment[]>(`${this.apiUrl}/tasks/${taskId}/attachments`);
    }

    download(attachmentId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/attachments/${attachmentId}/download`, {
            responseType: 'blob'
        });
    }

    delete(attachmentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/attachments/${attachmentId}`);
    }

    getFileSizeDisplay(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

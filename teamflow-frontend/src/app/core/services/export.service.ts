import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ExportService {
    private apiUrl = environment.apiUrl;
    private http = inject(HttpClient);

    exportProjects() {
        this.http.get(`${this.apiUrl}/projects/export`, { responseType: 'blob' }).subscribe(blob => {
            this.downloadFile(blob, 'projects.csv');
        });
    }

    exportTasks(projectId: number) {
        this.http.get(`${this.apiUrl}/projects/${projectId}/tasks/export`, { responseType: 'blob' }).subscribe(blob => {
            this.downloadFile(blob, `project_${projectId}_tasks.csv`);
        });
    }

    private downloadFile(blob: Blob, fileName: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

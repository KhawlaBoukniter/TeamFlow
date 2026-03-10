import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../../shared/models/audit-log.model';
import { PaginatedResponse } from '../../shared/models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

    constructor(private http: HttpClient) { }

    getAllLogs(page: number = 0, size: number = 20): Observable<PaginatedResponse<AuditLog>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<AuditLog>>(this.apiUrl, { params });
    }

    getLogsByProject(projectId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<AuditLog>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<AuditLog>>(`${environment.apiUrl}/projects/${projectId}/audit-logs`, { params });
    }
}

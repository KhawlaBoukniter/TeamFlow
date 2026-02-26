import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../../shared/models/audit-log.model';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

    constructor(private http: HttpClient) { }

    getAllLogs(): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(this.apiUrl);
    }
}

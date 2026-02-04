import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Membership } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class MembershipService {
    private apiUrl = `${environment.apiUrl}`;
    private http = inject(HttpClient);

    getMembers(projectId: number): Observable<Membership[]> {
        return this.http.get<Membership[]>(`${this.apiUrl}/projects/${projectId}/members`);
    }

    addMember(projectId: number, userId: number, role: 'MANAGER' | 'MEMBER'): Observable<Membership> {
        return this.http.post<Membership>(`${this.apiUrl}/projects/${projectId}/members`, {
            userId,
            roleInProject: role
        });
    }

    removeMember(membershipId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/members/${membershipId}`);
    }

    updateRole(membershipId: number, role: 'MANAGER' | 'MEMBER'): Observable<Membership> {
        return this.http.put<Membership>(`${this.apiUrl}/members/${membershipId}`, {
            roleInProject: role
        });
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models';
import { PaginatedResponse } from '../../shared/models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/users`;
    private http = inject(HttpClient);

    searchUsers(query: string, page: number = 0, size: number = 20): Observable<PaginatedResponse<User>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        if (query) {
            params = params.set('search', query);
        }
        return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
    }

    getAllUsers(page: number = 0, size: number = 20): Observable<PaginatedResponse<User>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
    }

    updateUser(id: number, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, data);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: number): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}/toggle-active`, {});
    }

    getProfile(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/profile`);
    }

    updateProfile(data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/profile`, data);
    }

    changePassword(data: any): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/change-password`, data);
    }
}

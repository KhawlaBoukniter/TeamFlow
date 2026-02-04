import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/users`;
    private http = inject(HttpClient);

    searchUsers(query: string): Observable<User[]> {
        let params = new HttpParams();
        if (query) {
            params = params.set('search', query);
        }
        return this.http.get<User[]>(this.apiUrl, { params });
    }
}

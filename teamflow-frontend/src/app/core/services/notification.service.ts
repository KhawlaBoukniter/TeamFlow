import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../../shared/models';
import { AuthService } from './auth.service';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private wsUrl = 'http://localhost:8080/ws';

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  private stompClient: Client | null = null;
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  constructor(private http: HttpClient) {
    this.initWebSocket();
  }

  private initWebSocket(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.stompClient?.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
          const notification: Notification = JSON.parse(message.body);
          this.ngZone.run(() => {
            this.notificationSubject.next(notification);
            this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
          });
        });
      },
      onStompError: (frame) => {
        console.error('Notification WS error:', frame.headers['message']);
      }
    });

    this.stompClient.activate();
  }

  getRecent(limit: number = 10): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}?limit=${limit}`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread/count`).pipe(
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}

import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatRoom, ChatMessage } from '../../shared/models';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly API_URL = environment.apiUrl;
    private readonly WS_URL = 'http://localhost:8080/ws';

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private ngZone = inject(NgZone);

    private stompClient: Client | null = null;
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    private connectedSubject = new BehaviorSubject<boolean>(false);
    private newMessagesSubject = new BehaviorSubject<ChatMessage | null>(null);

    public messages$ = this.messagesSubject.asObservable();
    public connected$ = this.connectedSubject.asObservable();
    public newMessages$ = this.newMessagesSubject.asObservable();

    private currentRoomId: number | null = null;

    getChatRoom(projectId: number): Observable<ChatRoom> {
        return this.http.get<ChatRoom>(`${this.API_URL}/projects/${projectId}/chat-room`);
    }

    getMessageHistory(roomId: number): Observable<ChatMessage[]> {
        return this.http.get<ChatMessage[]>(`${this.API_URL}/chat-rooms/${roomId}/messages`);
    }

    connect(roomId: number): void {
        if (this.currentRoomId === roomId && this.stompClient?.active) {
            return;
        }

        if (this.stompClient?.active) {
            this.disconnect();
        }

        this.currentRoomId = roomId;

        // Load existing messages first
        this.getMessageHistory(roomId).subscribe({
            next: (messages) => this.ngZone.run(() => this.messagesSubject.next(messages)),
            error: () => this.ngZone.run(() => this.messagesSubject.next([]))
        });

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(this.WS_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.ngZone.run(() => this.connectedSubject.next(true));

                // Subscribe to the project chat topic
                this.stompClient?.subscribe(`/topic/chat/${roomId}`, (message: IMessage) => {
                    const chatMessage: ChatMessage = JSON.parse(message.body);
                    const currentMessages = this.messagesSubject.value;
                    this.ngZone.run(() => {
                        this.messagesSubject.next([...currentMessages, chatMessage]);
                        this.newMessagesSubject.next(chatMessage);
                    });
                });

                // Subscribe to attachment updates
                this.stompClient?.subscribe(`/topic/chat/${roomId}/attachments`, (message: IMessage) => {
                    const attachment = JSON.parse(message.body);
                    const currentMessages = this.messagesSubject.value;
                    this.ngZone.run(() => {
                        const updated = currentMessages.map(msg => {
                            if (msg.id === attachment.messageId) {
                                return { ...msg, attachments: [...(msg.attachments || []), attachment] };
                            }
                            return msg;
                        });
                        this.messagesSubject.next(updated);
                    });
                });
            },
            onDisconnect: () => {
                this.ngZone.run(() => this.connectedSubject.next(false));
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message']);
                this.ngZone.run(() => this.connectedSubject.next(false));
            }
        });

        this.stompClient.activate();
    }

    sendMessage(content: string, parentMessageId?: number): void {
        if (!this.stompClient?.active || !this.currentRoomId) return;

        const userId = this.authService.getCurrentUserId();
        if (!userId) return;

        const message: ChatMessage = {
            content: content,
            senderId: userId,
            chatRoomId: this.currentRoomId,
            parentMessageId: parentMessageId
        };

        this.stompClient.publish({
            destination: `/app/chat/${this.currentRoomId}`,
            body: JSON.stringify(message)
        });
    }

    getUnreadCount(projectId: number): Observable<{ unreadCount: number }> {
        return this.http.get<{ unreadCount: number }>(`${this.API_URL}/projects/${projectId}/chat/unread-count`);
    }

    markAsRead(projectId: number): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/projects/${projectId}/chat/mark-as-read`, {});
    }

    disconnect(): void {
        if (this.stompClient?.active) {
            this.stompClient.deactivate();
        }
        this.currentRoomId = null;
        this.messagesSubject.next([]);
        this.connectedSubject.next(false);
    }
}

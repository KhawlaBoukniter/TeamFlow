import { Component, OnInit, OnDestroy, Input, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../../../core/services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatMessage } from '../../../../shared/models';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-window',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    template: `
    <!-- Chat Panel (Slide-in from right) -->
    <div class="chat-panel" [class.open]="isOpen">

      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-left">
          <mat-icon class="chat-icon">chat_bubble</mat-icon>
          <div>
            <h3 class="chat-title">Project Chat</h3>
            <span class="chat-status" [class.online]="isConnected">
              {{ isConnected ? 'Connected' : 'Connecting...' }}
            </span>
          </div>
        </div>
        <button mat-icon-button (click)="toggle()" class="close-btn" matTooltip="Close chat">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages.length === 0" class="empty-state">
          <mat-icon class="empty-icon">forum</mat-icon>
          <p>No messages yet</p>
          <span>Start the conversation!</span>
        </div>

        <div *ngFor="let msg of messages; trackBy: trackMessage" 
             class="message-wrapper"
             [class.own]="msg.senderId === currentUserId">
          
          <!-- Avatar -->
          <div class="msg-avatar" *ngIf="msg.senderId !== currentUserId">
            {{ getInitial(msg.senderName) }}
          </div>

          <div class="msg-bubble">
            <span class="msg-sender" *ngIf="msg.senderId !== currentUserId">
              {{ msg.senderName || 'User' }}
            </span>
            <p class="msg-content">{{ msg.content }}</p>
            <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <input 
            type="text"
            [(ngModel)]="newMessage"
            (keydown.enter)="send()"
            placeholder="Type a message..."
            class="chat-input"
            [disabled]="!isConnected">
          <button mat-icon-button 
                  (click)="send()" 
                  [disabled]="!newMessage.trim() || !isConnected"
                  class="send-btn"
                  matTooltip="Send message">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .chat-panel {
      position: fixed;
      right: -420px;
      top: 0;
      bottom: 0;
      width: 400px;
      background: #1C1C1E;
      border-left: 1px solid #2E3035;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
    }

    .chat-panel.open {
      right: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #2E3035;
      background: #1C1C1E;
      flex-shrink: 0;
    }

    .chat-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-icon {
      color: #5E6AD2;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .chat-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #EDEDED;
      line-height: 1.2;
    }

    .chat-status {
      font-size: 11px;
      color: #8A8F98;
    }

    .chat-status.online {
      color: #34D399;
    }

    .close-btn {
      color: #8A8F98 !important;
    }

    .close-btn:hover {
      color: #EDEDED !important;
    }

    /* Messages */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #3A3C42;
      border-radius: 4px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #46484E;
      gap: 8px;
    }

    .empty-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #2E3035;
    }

    .empty-state p {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
      color: #8A8F98;
    }

    .empty-state span {
      font-size: 13px;
      color: #46484E;
    }

    /* Message Bubbles */
    .message-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 85%;
    }

    .message-wrapper.own {
      margin-left: auto;
      flex-direction: row-reverse;
    }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #5E6AD2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .msg-bubble {
      padding: 8px 12px;
      border-radius: 12px;
      background: #2C2D32;
      border: 1px solid #3A3C42;
    }

    .message-wrapper.own .msg-bubble {
      background: #5E6AD2;
      border-color: #4e5ac0;
    }

    .msg-sender {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #8A8F98;
      margin-bottom: 2px;
    }

    .msg-content {
      margin: 0;
      font-size: 14px;
      color: #EDEDED;
      line-height: 1.4;
      word-break: break-word;
    }

    .msg-time {
      display: block;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      text-align: right;
    }

    .message-wrapper.own .msg-time {
      color: rgba(255, 255, 255, 0.6);
    }

    /* Input */
    .chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid #2E3035;
      background: #1C1C1E;
      flex-shrink: 0;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #2C2D32;
      border: 1px solid #3A3C42;
      border-radius: 10px;
      padding: 4px 4px 4px 16px;
      transition: border-color 0.2s;
    }

    .input-wrapper:focus-within {
      border-color: #5E6AD2;
    }

    .chat-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #EDEDED;
      font-size: 14px;
      padding: 8px 0;
    }

    .chat-input::placeholder {
      color: #46484E;
    }

    .chat-input:disabled {
      opacity: 0.5;
    }

    .send-btn {
      color: #5E6AD2 !important;
      transition: transform 0.15s;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.1);
    }

    .send-btn:disabled {
      color: #46484E !important;
    }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
    @Input() projectId!: number;
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

    isOpen = false;
    isConnected = false;
    messages: ChatMessage[] = [];
    newMessage = '';
    currentUserId: number | null = null;

    private chatService = inject(ChatService);
    private authService = inject(AuthService);
    private subs: Subscription[] = [];

    ngOnInit(): void {
        this.currentUserId = this.authService.getCurrentUserId();

        this.subs.push(
            this.chatService.messages$.subscribe(msgs => this.messages = msgs),
            this.chatService.connected$.subscribe(status => this.isConnected = status)
        );
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    toggle(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen && this.projectId) {
            this.connectToRoom();
        } else {
            this.chatService.disconnect();
        }
    }

    open(): void {
        if (!this.isOpen) {
            this.isOpen = true;
            this.connectToRoom();
        }
    }

    private connectToRoom(): void {
        this.chatService.getChatRoom(this.projectId).subscribe({
            next: (room) => {
                this.chatService.connect(room.id);
            },
            error: (err) => {
                console.error('Failed to get chat room:', err);
            }
        });
    }

    send(): void {
        if (!this.newMessage.trim()) return;
        this.chatService.sendMessage(this.newMessage.trim());
        this.newMessage = '';
    }

    formatTime(dateStr?: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getInitial(name?: string): string {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    trackMessage(index: number, msg: ChatMessage): number | undefined {
        return msg.id;
    }

    private scrollToBottom(): void {
        try {
            if (this.messagesContainer) {
                this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
            }
        } catch (err) { /* ignore */ }
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.chatService.disconnect();
    }
}

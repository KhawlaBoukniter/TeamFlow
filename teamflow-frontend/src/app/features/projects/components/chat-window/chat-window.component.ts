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
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TextFieldModule
  ],
  template: `
    <!-- Chat Panel (Slide-in from right) -->
    <div class="chat-panel" [class.open]="isOpen">

      <!-- Header with Glassmorphism -->
      <div class="chat-header">
        <div class="chat-header-blur"></div>
        <div class="chat-header-content">
          <div class="chat-header-left">
            <div class="chat-icon-wrapper">
              <mat-icon class="chat-icon">chat_bubble</mat-icon>
              <span class="status-dot" [class.online]="isConnected"></span>
            </div>
            <div class="header-info">
              <h3 class="chat-title">Project Discussion</h3>
              <span class="chat-status">
                {{ isConnected ? 'Live' : 'Connecting...' }}
              </span>
            </div>
          </div>
          <button mat-icon-button (click)="toggle()" class="close-btn" matTooltip="Close chat">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <mat-icon class="empty-icon">forum</mat-icon>
          </div>
          <p>Start a conversation</p>
          <span>All members of this project can see these messages.</span>
        </div>

        <ng-container *ngFor="let msg of messages; let i = index; trackBy: trackMessage">
          <!-- Date Separator (Optional: could add logic here for day change) -->
          
          <div class="message-wrapper"
               [class.own]="msg.senderId === currentUserId"
               [class.grouped]="isSameSender(i)">
            
            <!-- Avatar (only if not same sender) -->
            <div class="msg-avatar" *ngIf="msg.senderId !== currentUserId && !isSameSender(i)">
              {{ getInitial(msg.senderName) }}
            </div>
            <div class="avatar-spacer" *ngIf="msg.senderId !== currentUserId && isSameSender(i)"></div>

            <div class="msg-bubble-container shadow-sm">
              <!-- Sender Name (only if not same sender) -->
              <span class="msg-sender" *ngIf="msg.senderId !== currentUserId && !isSameSender(i)">
                {{ msg.senderName || 'User' }}
              </span>
              
              <div class="msg-bubble transition-all">
                <p class="msg-content">{{ msg.content }}</p>
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="input-container">
          <textarea 
            rows="1"
            [(ngModel)]="newMessage"
            (keydown.enter)="handleKeyDown($event)"
            placeholder="Write a message..."
            class="chat-input"
            [disabled]="!isConnected"
            cdkTextareaAutosize
            #autosize="cdkTextareaAutosize"></textarea>
          
          <div class="input-actions">
            <button mat-icon-button 
                    (click)="send()" 
                    [disabled]="!newMessage.trim() || !isConnected"
                    class="send-btn"
                    matTooltip="Send (Enter)">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .chat-panel {
      position: fixed;
      right: -420px;
      top: 0;
      bottom: 0;
      width: 380px;
      background: #09090b; /* Zinc 950 */
      border-left: 1px solid #1C1C1E;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -15px 0 30px rgba(0, 0, 0, 0.5);
    }

    .chat-panel.open {
      right: 0;
    }

    /* Header Glassmorphism */
    .chat-header {
      position: relative;
      height: 64px;
      flex-shrink: 0;
      z-index: 10;
    }

    .chat-header-blur {
      position: absolute;
      inset: 0;
      background: rgba(13, 13, 15, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .chat-header-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 100%;
    }

    .chat-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-icon-wrapper {
      position: relative;
      width: 32px;
      height: 32px;
      background: rgba(94, 106, 210, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-icon {
      color: #5E6AD2;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 8px;
      height: 8px;
      background: #46484E;
      border-radius: 50%;
      border: 2px solid #09090b;
    }

    .status-dot.online {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    .header-info {
      display: flex;
      flex-direction: column;
    }

    .chat-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #EDEDED;
      letter-spacing: -0.01em;
    }

    .chat-status {
      font-size: 11px;
      color: #8A8F98;
      font-weight: 500;
      margin-top: 1px;
    }

    .close-btn {
      color: #8A8F98 !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      color: #EDEDED !important;
    }

    /* Messages Area */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      scrollbar-gutter: stable;
    }

    .chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 40px;
      text-align: center;
    }

    .empty-icon-wrapper {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: #3A3C42;
    }

    .empty-state p {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #EDEDED;
    }

    .empty-state span {
      font-size: 13px;
      color: #8A8F98;
      margin-top: 8px;
      line-height: 1.5;
    }

    /* Message Wrapper Logic */
    .message-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 2px;
      animation: msgReveal 0.3s ease-out;
    }

    @keyframes msgReveal {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-wrapper.grouped {
      margin-top: -2px;
    }

    .message-wrapper.own {
      flex-direction: row-reverse;
    }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #2C2D32;
      color: #EDEDED;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 18px;
    }

    .avatar-spacer {
       width: 28px;
       flex-shrink: 0;
    }

    .msg-bubble-container {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }

    .message-wrapper.own .msg-bubble-container {
      align-items: flex-end;
    }

    .msg-sender {
      font-size: 11px;
      font-weight: 600;
      color: #8A8F98;
      margin-left: 2px;
      margin-bottom: 4px;
    }

    .msg-bubble {
      padding: 8px 12px;
      border-radius: 12px;
      background: #1C1C1E;
      border: 1px solid #2E3035;
      position: relative;
    }

    .message-wrapper.own .msg-bubble {
      background: linear-gradient(135deg, #5E6AD2 0%, #4e5ac0 100%);
      border: none;
      color: white;
    }

    /* Shape refinements for grouped messages */
    .message-wrapper:not(.grouped) .msg-bubble {
      border-bottom-left-radius: 4px;
    }
    .message-wrapper.own:not(.grouped) .msg-bubble {
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 4px;
    }

    .msg-content {
      margin: 0;
      font-size: 13.5px;
      color: #EDEDED;
      line-height: 1.5;
      word-break: break-word;
    }

    .message-wrapper.own .msg-content {
      color: white;
    }

    .msg-time {
      display: block;
      font-size: 9px;
      color: #46484E;
      margin-top: 4px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .message-wrapper.own .msg-time {
      color: rgba(255, 255, 255, 0.5);
    }

    /* Input Area - Linear Style */
    .chat-input-area {
      padding: 16px;
      background: #09090b;
      border-top: 1px solid #1C1C1E;
      flex-shrink: 0;
    }

    .input-container {
      background: #131315;
      border: 1px solid #1C1C1E;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .input-container:focus-within {
      border-color: #2E3035;
      background: #18181b;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .chat-input {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: #EDEDED;
      font-size: 13.5px;
      max-height: 120px;
      resize: none;
      padding: 4px 0;
      line-height: 1.5;
    }

    .chat-input::placeholder {
      color: #46484E;
    }

    .input-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .send-btn {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      color: #5E6AD2 !important;
    }

    .send-btn mat-icon {
       font-size: 18px;
       width: 18px;
       height: 18px;
    }

    .send-btn:hover:not(:disabled) {
       background: rgba(94, 106, 210, 0.1) !important;
    }

    .send-btn:disabled {
      color: #2E3035 !important;
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

  handleKeyDown(event: any): void {
    if (event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  isSameSender(index: number): boolean {
    if (index === 0) return false;
    const currentMsg = this.messages[index];
    const prevMsg = this.messages[index - 1];
    return currentMsg.senderId === prevMsg.senderId;
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

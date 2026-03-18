import { Component, OnInit, OnDestroy, Input, inject, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../../../core/services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MembershipService } from '../../../../core/services/membership.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { ChatMessage, Membership, Attachment } from '../../../../shared/models';
import { Subscription, tap, skip } from 'rxjs';
import { TextFieldModule } from '@angular/cdk/text-field';
import { environment } from '../../../../../environments/environment';

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
    <div class="chat-panel" 
         [class.open]="isOpen"
         [class.resizing]="isResizing"
         [style.width.px]="chatWidth"
         [style.right.px]="isOpen ? 0 : -(chatWidth + 20)">

      <!-- Resize Handle -->
      <div class="resize-handle" (mousedown)="startResizing($event)"></div>

      <!-- Ambient glow -->
      <div class="ambient-glow"></div>

      <!-- Header -->
      <div class="chat-header">
        <div class="header-left">
          <div class="channel-badge">
            <span class="hash">#</span>
          </div>
          <div class="header-text">
            <h3>general</h3>
            <div class="header-meta">
              <span class="pulse-dot" [class.live]="isConnected"></span>
              <span class="meta-text">{{ isConnected ? 'Live' : 'Reconnecting...' }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ messages.length }} messages</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="header-btn" matTooltip="Members">
            <mat-icon>group</mat-icon>
          </button>
          <button class="header-btn close" (click)="toggle()" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #messagesContainer (scroll)="onScroll()">
        <!-- Welcome -->
        <div *ngIf="messages.length === 0" class="welcome-card">
          <div class="welcome-glow"></div>
          <div class="welcome-content">
            <div class="welcome-emoji">💬</div>
            <h3>Start the conversation</h3>
            <p>This is the beginning of <strong>#general</strong>. Share ideas and collaborate with your team.</p>
            <div class="welcome-hints">
              <div class="hint"><mat-icon>keyboard_return</mat-icon> Enter to send</div>
              <div class="hint"><mat-icon>keyboard</mat-icon> Shift+Enter for new line</div>
            </div>
          </div>
        </div>

        <ng-container *ngFor="let msg of messages; let i = index; trackBy: trackMessage">
          <!-- Date chip -->
          <div class="date-chip" *ngIf="shouldShowDate(i)">
            <span>{{ formatDate(msg.createdAt) }}</span>
          </div>

          <!-- Message -->
          <div class="message"
               [id]="'msg-' + msg.id"
               [class.compact]="isCompact(i)"
               [class.first-of-group]="!isCompact(i)"
               [class.highlighted]="highlightedMessageId === msg.id">

            <!-- Full (avatar + name) -->
            <ng-container *ngIf="!isCompact(i)">
              <div class="msg-row">
                <div class="avatar" [style.background]="getAvatarGradient(msg.senderName)">
                  {{ getInitial(msg.senderName) }}
                </div>
                <div class="msg-body">
                  <!-- Reply Context -->
                  <div class="reply-context" *ngIf="msg.parentMessageId" (click)="scrollToMessage(msg.parentMessageId)">
                    <mat-icon>reply</mat-icon>
                    <span class="reply-author" [style.color]="getNameColor(msg.parentMessageSenderName)">
                      @{{ msg.parentMessageSenderName }}
                    </span>
                    <span class="reply-text">{{ msg.parentMessageContent }}</span>
                  </div>

                  <div class="msg-content">
                    <div class="msg-meta">
                      <span class="author" [style.color]="getNameColor(msg.senderName)">
                        {{ msg.senderId === currentUserId ? 'You' : (msg.senderName || 'User') }}
                      </span>
                      <span class="timestamp">{{ formatTime(msg.createdAt) }}</span>
                    </div>
                    <p class="msg-text" *ngIf="msg.content" [innerHTML]="renderMentions(msg.content)"></p>

                    <!-- Attachments in Message -->
                    <div class="msg-attachments" *ngIf="msg.attachments && msg.attachments.length > 0">
                      <div class="attachment-item" *ngFor="let att of msg.attachments">
                        <!-- Image Preview -->
                        <div class="image-preview" *ngIf="isImage(att.fileType)" (click)="openZoom(att)" [matTooltip]="'View ' + att.fileName">
                          <img *ngIf="loadedImageUrls.get(att.id) as src" [src]="src" [alt]="att.fileName">
                          <div class="image-loading" *ngIf="!loadedImageUrls.has(att.id)">
                            <mat-icon class="spin">refresh</mat-icon>
                          </div>
                          <div class="image-overlay">
                            <mat-icon>zoom_in</mat-icon>
                          </div>
                        </div>

                        <!-- File Card (Non-Image) -->
                        <div class="msg-attachment" *ngIf="!isImage(att.fileType)" (click)="downloadAttachment(att)">
                          <div class="att-icon">
                            <mat-icon>{{ getFileIcon(att.fileType) }}</mat-icon>
                          </div>
                          <div class="att-info">
                            <span class="att-name">{{ att.fileName }}</span>
                            <span class="att-size">{{ formatSize(att.fileSize) }}</span>
                          </div>
                          <mat-icon class="att-download">download</mat-icon>
                        </div>
                      </div>
                    </div>

                    <!-- Message Actions (Hover) -->
                    <div class="message-actions">
                      <button class="action-btn" (click)="setReply(msg)" matTooltip="Reply">
                        <mat-icon>reply</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Compact (no avatar) -->
            <ng-container *ngIf="isCompact(i)">
              <div class="msg-row-compact">
                <span class="hover-ts">{{ formatTime(msg.createdAt) }}</span>
                <p class="msg-text compact-text">{{ msg.content }}</p>
                
                <!-- Attachments in Compact Message -->
                <div class="msg-attachments" *ngIf="msg.attachments && msg.attachments.length > 0">
                  <div class="attachment-item" *ngFor="let att of msg.attachments">
                    <!-- Image Preview -->
                    <div class="image-preview" *ngIf="isImage(att.fileType)" (click)="openZoom(att)" [matTooltip]="'View ' + att.fileName">
                      <img *ngIf="loadedImageUrls.get(att.id) as src" [src]="src" [alt]="att.fileName">
                      <div class="image-loading" *ngIf="!loadedImageUrls.has(att.id)">
                        <mat-icon class="spin">refresh</mat-icon>
                      </div>
                      <div class="image-overlay">
                        <mat-icon>zoom_in</mat-icon>
                      </div>
                    </div>

                    <!-- File Card (Non-Image) -->
                    <div class="msg-attachment" *ngIf="!isImage(att.fileType)" (click)="downloadAttachment(att)">
                      <div class="att-icon">
                        <mat-icon>{{ getFileIcon(att.fileType) }}</mat-icon>
                      </div>
                      <div class="att-info">
                        <span class="att-name">{{ att.fileName }}</span>
                        <span class="att-size">{{ formatSize(att.fileSize) }}</span>
                      </div>
                      <mat-icon class="att-download">download</mat-icon>
                    </div>
                  </div>
                </div>

                <!-- Message Actions (Hover) -->
                <div class="message-actions">
                  <button class="action-btn" (click)="setReply(msg)" matTooltip="Reply">
                    <mat-icon>reply</mat-icon>
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </ng-container>

        <!-- New Messages Indicator -->
        <div class="new-messages-badge" *ngIf="unreadSinceScroll > 0" (click)="jumpToBottom()">
          <mat-icon>keyboard_arrow_down</mat-icon>
          <span>{{ unreadSinceScroll }} {{ unreadSinceScroll === 1 ? 'nouveau' : 'nouveaux' }} message{{ unreadSinceScroll > 1 ? 's' : '' }}</span>
        </div>

        <!-- Scroll To Bottom Button (Simple Arrow when scrolled up but no new msgs) -->
        <button class="scroll-bottom-btn" *ngIf="unreadSinceScroll === 0 && !isNearBottom" (click)="jumpToBottom()">
          <mat-icon>keyboard_arrow_down</mat-icon>
        </button>
      </div>

      <!-- Typing indicator -->
      <div class="typing-bar" *ngIf="typingUsers.length > 0">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span>{{ typingLabel }}</span>
      </div>

      <!-- Emoji picker -->
      <div class="emoji-picker" *ngIf="showEmojiPicker">
        <div class="emoji-grid">
          <button *ngFor="let e of emojis" class="emoji-btn" (click)="insertEmoji(e)">{{ e }}</button>
        </div>
      </div>

      <!-- Reply Preview -->
      <div class="reply-preview-bar" *ngIf="replyToMessage">
        <div class="reply-info">
          <span class="replying-to">Replying to <strong>{{ replyToMessage.senderName }}</strong></span>
          <p class="preview-text">{{ replyToMessage.content }}</p>
        </div>
        <button class="cancel-reply" (click)="cancelReply()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- File Previews -->
      <div class="file-previews" *ngIf="selectedFiles.length > 0">
        <div class="preview-card" *ngFor="let f of selectedFiles; let idx = index">
          <div class="preview-icon">
            <mat-icon>{{ getFileIcon(f.type) }}</mat-icon>
          </div>
          <div class="preview-info">
            <span class="preview-name">{{ f.name }}</span>
            <span class="preview-size">{{ formatSize(f.size) }}</span>
          </div>
          <button class="remove-file" (click)="removeFile(idx)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Input -->
      <div class="input-area">
        <!-- Mention List (inside input-area for correct absolute positioning) -->
        <div class="mention-list" *ngIf="showMentionList">
          <div 
            class="mention-item" 
            *ngFor="let member of filteredMembers; let i = index" 
            [class.active]="i === mentionSelectedIndex"
            (mouseenter)="mentionSelectedIndex = i"
            (click)="insertMention(member)">
            <div class="mini-avatar" [style.background]="getAvatarGradient(member.userName)">
              {{ getInitial(member.userName) }}
            </div>
            <span class="mention-name">{{ member.userName }}</span>
            <span class="mention-role">{{ member.roleInProject }}</span>
          </div>
          <div *ngIf="filteredMembers.length === 0" class="mention-empty">No members found</div>
        </div>
        <div class="input-box" [class.active]="inputFocused">
          <textarea
            rows="1"
            [(ngModel)]="newMessage"
            (keydown.enter)="handleKeyDown($event)"
            (keydown)="onInputKeyDown($event)"
            (input)="onInputChange($event)"
            (focus)="inputFocused = true"
            (blur)="onBlur()"
            placeholder="Message #general..."
            class="msg-input"
            [disabled]="!isConnected"
            cdkTextareaAutosize
            #autosize="cdkTextareaAutosize"
            #msgInput></textarea>
          <div class="input-bottom">
            <div class="input-tools">
              <input type="file" #fileInput hidden multiple (change)="onFileSelected($event)">
              <button class="tool-btn" (click)="fileInput.click()" matTooltip="Attach file">
                <mat-icon>add_circle_outline</mat-icon>
              </button>
              <button class="tool-btn" [class.tool-active]="showEmojiPicker" (click)="showEmojiPicker = !showEmojiPicker" matTooltip="Emoji">
                <mat-icon>mood</mat-icon>
              </button>
            </div>
            <button class="send-btn"
                    (click)="send()"
                    [disabled]="(!newMessage.trim() && selectedFiles.length === 0) || !isConnected"
                    [class.ready]="(newMessage.trim() || selectedFiles.length > 0) && isConnected">
              <mat-icon>arrow_upward</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Lightbox Popup -->
      <div class="lightbox-overlay" *ngIf="zoomedImageUrl" (click)="closeZoom()">
        <div class="lightbox-content" (click)="$event.stopPropagation()">
          <div class="lightbox-header">
            <span class="lightbox-title">{{ zoomedImage?.fileName }}</span>
            <div class="lightbox-actions">
              <button class="lightbox-btn" (click)="downloadAttachment(zoomedImage!)" matTooltip="Download">
                <mat-icon>download</mat-icon>
              </button>
              <button class="lightbox-btn close" (click)="closeZoom()" matTooltip="Close">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          <div class="lightbox-image-container">
            <img [src]="zoomedImageUrl" [alt]="zoomedImage?.fileName" class="lightbox-image">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ==================== PANEL ==================== */
    /* Hide all scroll arrows globally in the panel */
    .chat-panel *::-webkit-scrollbar-button { display: none !important; height: 0 !important; width: 0 !important; }

    .chat-panel {
      position: fixed;
      right: -460px;
      top: 0; bottom: 0;
      background: #0A0A0C;
      border-left: 1px solid rgba(255,255,255,0.04);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: visible; /* Allow handle to be visible or at least reachable */
    }
    .chat-panel.resizing { transition: none; }
    .chat-panel.open { /* right: 0;  -- handled by [style.right.px] now */ }

    .resize-handle {
      position: absolute;
      left: -4px; top: 0; bottom: 0;
      width: 8px;
      cursor: ew-resize;
      z-index: 100;
      transition: background 0.2s;
    }
    .resize-handle:hover, .chat-panel.resizing .resize-handle {
      background: rgba(94, 106, 210, 0.3);
    }

    .ambient-glow {
      position: absolute;
      top: -100px; right: -100px;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(94,106,210,0.08) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }

    /* ==================== HEADER ==================== */
    .chat-header {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px 0 18px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(10,10,12,0.9);
      backdrop-filter: blur(20px);
      flex-shrink: 0; z-index: 2;
      position: relative;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }

    .channel-badge {
      width: 34px; height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(94,106,210,0.2), rgba(94,106,210,0.05));
      border: 1px solid rgba(94,106,210,0.15);
      display: flex; align-items: center; justify-content: center;
    }
    .hash { font-size: 18px; font-weight: 800; color: #5E6AD2; }

    .header-text h3 { margin: 0; font-size: 15px; font-weight: 700; color: #EDEDED; letter-spacing: -0.02em; }
    .header-meta { display: flex; align-items: center; gap: 6px; margin-top: 1px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A4D54; }
    .pulse-dot.live { background: #10b981; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
    }
    .meta-text { font-size: 11px; color: #6B6F76; }
    .meta-sep { color: #3A3C42; font-size: 10px; }

    .header-actions { display: flex; gap: 4px; }
    .header-btn {
      width: 32px; height: 32px;
      border: none; background: transparent;
      color: #6B6F76; cursor: pointer;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .header-btn:hover { background: rgba(255,255,255,0.06); color: #EDEDED; }
    .header-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ==================== MESSAGES ==================== */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0 16px;
      display: flex;
      flex-direction: column;
      position: relative; z-index: 1;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.06) transparent;
    }
    .messages-area::-webkit-scrollbar { width: 5px; }
    .messages-area::-webkit-scrollbar-track { background: transparent; }
    .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
    .messages-area::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
    .messages-area::-webkit-scrollbar-button { display: none; height: 0; width: 0; }

    /* Welcome card */
    .welcome-card {
      margin: auto 20px; padding: 36px 28px;
      border-radius: 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
      text-align: center; position: relative; overflow: hidden;
    }
    .welcome-glow {
      position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
      width: 200px; height: 120px;
      background: radial-gradient(ellipse, rgba(94,106,210,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .welcome-content { position: relative; z-index: 1; }
    .welcome-emoji { font-size: 40px; margin-bottom: 16px; }
    .welcome-card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; color: #EDEDED; }
    .welcome-card p { margin: 0 0 20px; font-size: 13px; color: #8A8F98; line-height: 1.6; }
    .welcome-card strong { color: #EDEDED; }
    .welcome-hints { display: flex; gap: 16px; justify-content: center; }
    .hint { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #4A4D54; }
    .hint mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Date chip */
    .date-chip { display: flex; justify-content: center; padding: 16px 0 8px; }
    .date-chip span {
      font-size: 10px; font-weight: 700; color: #8A8F98;
      text-transform: uppercase; letter-spacing: 0.08em;
      background: rgba(255,255,255,0.04);
      padding: 4px 12px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.04);
    }

    /* Message */
    .message {
      padding: 2px 20px;
      position: relative;
      transition: background 0.1s ease;
    }
    .message:hover { background: rgba(255,255,255,0.015); }
    .message.first-of-group { padding-top: 10px; }

    /* Full row (avatar + body) */
    .msg-row { display: flex; align-items: flex-start; gap: 12px; }

    /* Compact row (indented to align with text above) */
    .msg-row-compact {
      position: relative;
      padding-left: 48px; /* 36px avatar + 12px gap */
    }

    .hover-ts {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 9px;
      color: transparent;
      font-variant-numeric: tabular-nums;
      transition: color 0.15s ease;
    }
    .message:hover .hover-ts { color: #4A4D54; }

    /* Message actions (Hover) */
    .msg-content, .msg-row-compact { position: relative; }

    .message-actions {
      position: absolute;
      right: 4px;
      top: -12px;
      background: #111113;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      display: none;
      padding: 4px;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .message:hover .message-actions { display: flex; gap: 2px; }

    .action-btn {
      width: 28px; height: 28px;
      border: none; background: transparent;
      color: #8A8F98; cursor: pointer;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.1s ease;
    }
    .action-btn:hover { background: rgba(255,255,255,0.06); color: #EDEDED; }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Reply context (within message) */
    .reply-context {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      position: relative;
      padding-left: 20px;
    }
    .reply-context::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      height: 100%;
      width: 14px;
      border-left: 2px solid rgba(255,255,255,0.1);
      border-top: 2px solid rgba(255,255,255,0.1);
      border-top-left-radius: 4px;
    }
    .reply-context mat-icon { font-size: 12px; width: 12px; height: 12px; color: #4A4D54; transform: rotate(180deg); }
    .reply-author { font-size: 11px; font-weight: 700; opacity: 0.8; }
    .reply-text { font-size: 11px; color: #8A8F98; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }

    /* Reply preview (above input) */
    .reply-preview-bar {
      margin: 0 14px 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
      border-left: 2px solid #5E6AD2;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      animation: previewIn 0.2s ease-out;
    }
    @keyframes previewIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .reply-info { min-width: 0; flex: 1; }
    .replying-to { display: block; font-size: 11px; color: #8A8F98; margin-bottom: 2px; }
    .replying-to strong { color: #5E6AD2; }
    .preview-text {
      margin: 0; font-size: 12px; color: #D4D4D8;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .cancel-reply {
      background: transparent; border: none;
      color: #4A4D54; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 2px; margin-left: 8px;
    }
    .cancel-reply:hover { color: #F87171; }
    .cancel-reply mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Avatar */
    .avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
      color: white; flex-shrink: 0;
      text-transform: uppercase;
    }

    .msg-body { flex: 1; min-width: 0; }
    .msg-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
    .author { font-size: 14px; font-weight: 700; cursor: pointer; }
    .author:hover { text-decoration: underline; }
    .timestamp { font-size: 10px; color: #4A4D54; font-variant-numeric: tabular-nums; }

    .msg-text {
      margin: 0; font-size: 14px; color: #D4D4D8;
      line-height: 1.5; word-break: break-word; white-space: pre-wrap;
    }

    /* ==================== TYPING ==================== */
    .typing-bar {
      padding: 4px 20px 6px;
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: #8A8F98;
      flex-shrink: 0;
    }
    .typing-dots { display: flex; gap: 3px; }
    .typing-dots span {
      width: 5px; height: 5px;
      border-radius: 50%; background: #5E6AD2;
      animation: bounce 1.4s ease-in-out infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    /* ==================== EMOJI PICKER ==================== */
    .emoji-picker {
      padding: 8px 14px;
      border-top: 1px solid rgba(255,255,255,0.05);
      background: #111113;
      flex-shrink: 0;
      z-index: 3;
    }
    .emoji-grid {
      display: flex; flex-wrap: wrap; gap: 2px;
      max-height: 160px; overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.06) transparent;
    }
    .emoji-grid::-webkit-scrollbar { width: 4px; }
    .emoji-grid::-webkit-scrollbar-track { background: transparent; }
    .emoji-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
    .emoji-grid::-webkit-scrollbar-button { display: none; }

    .emoji-btn {
      width: 36px; height: 36px;
      border: none; background: transparent;
      cursor: pointer; border-radius: 6px;
      font-size: 20px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.1s ease;
    }
    .emoji-btn:hover { background: rgba(255,255,255,0.08); }

    /* ==================== INPUT ==================== */
    .input-area {
      padding: 0 14px 14px;
      flex-shrink: 0;
      position: relative; z-index: 2;
    }
    .input-box {
      background: #141416;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex; flex-direction: column; gap: 6px;
      transition: all 0.25s ease;
    }
    .input-box.active {
      border-color: rgba(94,106,210,0.35);
      background: #18181C;
      box-shadow: 0 0 0 3px rgba(94,106,210,0.06), 0 8px 32px rgba(0,0,0,0.3);
    }

    .msg-input {
      width: 100%; background: transparent;
      border: none; outline: none;
      color: #EDEDED; font-size: 14px;
      max-height: 140px; resize: none;
      padding: 2px 0; line-height: 1.5; font-family: inherit;
    }
    .msg-input::placeholder { color: #3D3F45; }

    .input-bottom { display: flex; align-items: center; justify-content: space-between; }
    .input-tools { display: flex; gap: 2px; }

    .tool-btn {
      width: 30px; height: 30px;
      border: none; background: transparent;
      color: #4A4D54; cursor: pointer;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .tool-btn:hover { background: rgba(255,255,255,0.05); color: #8A8F98; }
    .tool-btn.tool-active { color: #5E6AD2; background: rgba(94,106,210,0.1); }
    .tool-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .send-btn {
      width: 32px; height: 32px;
      border: none; background: #2C2D32;
      color: #4A4D54; cursor: default;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .send-btn.ready {
      background: #5E6AD2; color: white; cursor: pointer;
      box-shadow: 0 2px 12px rgba(94,106,210,0.35);
    }
    .send-btn.ready:hover {
      background: #6E7AE2; transform: scale(1.08);
      box-shadow: 0 4px 20px rgba(94,106,210,0.45);
    }
    .send-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ==================== ANIMATIONS ==================== */
    .message { animation: msgIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Mention List */
    .mention-list {
      position: absolute;
      bottom: 100%;
      left: 14px;
      right: 14px;
      background: #111113;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      margin-bottom: 8px;
      box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1001;
    }
    .mention-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.1s ease;
    }
    .mention-item:hover { background: rgba(94,106,210,0.1); }
    .mini-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white;
    }
    .mention-name { font-size: 13px; color: #EDEDED; flex: 1; }
    .mention-role { font-size: 10px; color: #4A4D54; text-transform: uppercase; letter-spacing: 0.04em; }
    .mention-empty { padding: 12px; text-align: center; color: #4A4D54; font-size: 12px; }

    /* Hide scrollbar buttons (re-applied specifically for chat) */
    .chat-panel *::-webkit-scrollbar-button { display: none !important; }

    /* Attachments in Message */
    .msg-attachments {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
    }
    .msg-attachment {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      cursor: pointer;
      max-width: 240px;
      transition: all 0.2s ease;
    }
    .msg-attachment:hover { background: rgba(255,255,255,0.06); border-color: rgba(94,106,210,0.3); }
    .att-icon { color: #5E6AD2; }
    .att-info { display: flex; flex-direction: column; overflow: hidden; }
    .att-name { font-size: 12px; color: #EDEDED; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .att-size { font-size: 10px; color: #4A4D54; }
    .att-download { font-size: 14px; width: 14px; height: 14px; color: transparent; margin-left: auto; transition: color 0.2s; }
    .msg-attachment:hover .att-download { color: #8A8F98; }
    
    .image-preview {
      margin-top: 4px;
      max-width: 280px;
      max-height: 360px;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
      transition: all 0.2s ease;
    }
    .image-preview:hover { border-color: rgba(94,106,210,0.4); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .image-preview img {
      width: 100%;
      height: auto;
      max-height: 360px;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }
    .image-preview:hover img { transform: scale(1.05); }
    .image-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .image-preview:hover .image-overlay { opacity: 1; }
    .image-overlay mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }

    .image-loading {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.02);
      color: #4A4D54;
    }
    .spin { animation: rotate 2s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* File Previews (above input) */
    .file-previews {
      margin: 0 14px 10px;
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .preview-card {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px;
      background: rgba(94,106,210,0.1);
      border: 1px solid rgba(94,106,210,0.2);
      border-radius: 8px;
      max-width: 200px;
      position: relative;
    }
    .preview-icon { color: #5E6AD2; }
    .preview-info { display: flex; flex-direction: column; overflow: hidden; }
    .preview-name { font-size: 11px; color: #EDEDED; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .preview-size { font-size: 9px; color: #8A8F98; }
    .remove-file {
      position: absolute; -top: 6px; -right: 6px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #F87171; color: white;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .remove-file mat-icon { font-size: 12px; width: 12px; height: 12px; }

    /* Highlight Animation */
    .message.highlighted {
      background: rgba(94, 106, 210, 0.15) !important;
      animation: highlightPulse 2s ease-out;
    }
    .reply-context { cursor: pointer; }
    .reply-context:hover .reply-text { text-decoration: underline; color: #EDEDED; }

    @keyframes highlightPulse {
      0% { background: rgba(94, 106, 210, 0); box-shadow: inset 0 0 0 0 rgba(94, 106, 210, 0); }
      20% { background: rgba(94, 106, 210, 0.25); box-shadow: inset 0 0 40px rgba(94, 106, 210, 0.15); }
      100% { background: rgba(94, 106, 210, 0); box-shadow: inset 0 0 0 0 rgba(94, 106, 210, 0); }
    }

    /* New Messages Badge */
    .new-messages-badge {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FF3D00 0%, #FF8F00 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(255, 61, 0, 0.4);
      z-index: 100;
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      backdrop-filter: blur(8px);
    }

    .new-messages-badge:hover {
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 61, 0, 0.5);
    }

    .scroll-bottom-btn {
      position: absolute;
      bottom: 80px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(46, 47, 52, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 100;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
      animation: fadeIn 0.3s ease;
    }

    .scroll-bottom-btn:hover {
      background: rgba(60, 61, 67, 0.9);
      transform: translateY(-2px);
    }

    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(20px); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Mention Dropdown */
    .mention-list {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: #1A1B1F;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
      z-index: 500;
      animation: slideUp 0.15s ease-out;
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 6px;
    }
    .mention-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .mention-item:hover, .mention-item.active {
      background: rgba(94, 106, 210, 0.15);
    }
    .mention-item.active { border-left: 2px solid #5E6AD2; }
    .mention-name { font-size: 13px; font-weight: 600; color: #EDEDED; }
    .mention-role {
      margin-left: auto;
      font-size: 11px;
      color: #5A5E6E;
      text-transform: capitalize;
    }
    .mention-empty { padding: 12px 14px; color: #5A5E6E; font-size: 13px; }
    .mini-avatar {
      width: 24px; height: 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }

    /* @Mention highlight in messages */
    ::ng-deep .msg-text .mention-chip {
      display: inline-block;
      background: rgba(94, 106, 210, 0.2);
      color: #818CF8;
      font-weight: 600;
      border-radius: 4px;
      padding: 0 4px;
    }
    ::ng-deep .msg-text .mention-chip.self {
      background: rgba(248, 113, 113, 0.15);
      color: #F87171;
    }

    /* Lightbox Styles */
    .lightbox-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: fadeIn 0.15s ease-out;
    }
    .lightbox-content {
      width: 100%; max-width: 400px;
      display: flex; flex-direction: column;
      background: #141416;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6);
      animation: scaleIn 0.25s cubic-bezier(0.17, 0.67, 0.41, 1.08);
    }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .lightbox-header {
      padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.02);
    }
    .lightbox-title { font-size: 13px; font-weight: 600; color: #EDEDED; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lightbox-actions { display: flex; gap: 8px; }
    .lightbox-btn {
      width: 32px; height: 32px; border: none; background: transparent;
      color: #8A8F98; cursor: pointer; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .lightbox-btn:hover { background: rgba(255,255,255,0.08); color: #EDEDED; }
    .lightbox-btn.close:hover { color: #F87171; }

    .lightbox-image-container {
      flex: 1; display: flex; align-items: center; justify-content: center;
      background: #0A0A0C; padding: 10px; min-height: 200px;
    }
    .lightbox-image { max-width: 100%; max-height: 50vh; object-fit: contain; }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() projectId!: number;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('msgInput') private msgInput!: ElementRef;

  private _isOpen = false;
  isConnected = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId: number | null = null;
  inputFocused = false;
  showEmojiPicker = false;
  replyToMessage: ChatMessage | null = null;
  highlightedMessageId: number | null = null;
  unreadSinceScroll: number = 0;
  public isNearBottom = true;

  // Typing
  typingUsers: string[] = [];
  private typingTimeout: any;
  private typingCleanupTimers: Map<string, any> = new Map();

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private membershipService = inject(MembershipService);
  private attachmentService = inject(AttachmentService);
  private sanitizer = inject(DomSanitizer);
  private subs: Subscription[] = [];

  // Image Preview URLs (Secure loading via Blob)
  loadedImageUrls: Map<number, string> = new Map();

  // Lightbox State
  zoomedImage: Attachment | null = null;
  zoomedImageUrl: string | null = null;

  // Attachments
  selectedFiles: File[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Mentions
  projectMembers: Membership[] = [];
  filteredMembers: Membership[] = [];
  showMentionList = false;
  mentionSearchTerm = '';
  mentionStartIndex = -1;
  mentionSelectedIndex = -1;

  // Resize
  chatWidth = 440;
  isResizing = false;
  private readonly MIN_WIDTH = 320;
  private readonly MAX_WIDTH = 800;

  // Scroll tracking
  private shouldScrollToBottom = false;
  private pendingScrollAttempts = 0;

  // Emojis
  emojis = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥',
    '🎉', '🚀', '💯', '✅', '❌', '⭐', '💡', '📌', '🙏', '👋',
    '😊', '🤣', '😘', '🥳', '🤩', '😢', '😤', '🫡', '🤝', '💪',
    '🎯', '⚡', '🌟', '💎', '🏆', '📎', '💻', '🎨', '🛠️', '📝'
  ];

  // Unique colors per user
  private nameColors = [
    '#E879F9', '#818CF8', '#34D399', '#F472B6',
    '#60A5FA', '#FBBF24', '#A78BFA', '#FB923C',
    '#2DD4BF', '#F87171', '#4ADE80', '#38BDF8'
  ];

  getAvatarGradient(name?: string): string {
    const c = this.getNameColor(name);
    return `linear-gradient(135deg, ${c}CC, ${c}66)`;
  }

  getNameColor(name?: string): string {
    return this.nameColors[this.hashName(name) % this.nameColors.length];
  }

  private hashName(name?: string): number {
    if (!name) return 0;
    let h = 0;
    for (let i = 0; i < name.length; i++) { h = ((h << 5) - h) + name.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  get typingLabel(): string {
    if (this.typingUsers.length === 1) return `${this.typingUsers[0]} is typing...`;
    if (this.typingUsers.length === 2) return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    return 'Several people are typing...';
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();

    // Load saved width
    const savedWidth = localStorage.getItem('teamflow_chat_width');
    if (savedWidth) {
      this.chatWidth = Math.min(Math.max(parseInt(savedWidth, 10), this.MIN_WIDTH), this.MAX_WIDTH);
    }

    this.subs.push(
      this.chatService.messages$.pipe(
        tap((msgs) => {
          this.processImageAttachments(msgs);
          if (this.shouldScrollToBottom || this.isNearBottom) {
            this.pendingScrollAttempts = 3;
            this.shouldScrollToBottom = false;
          }
        })
      ).subscribe(msgs => this.messages = msgs),
      this.chatService.newMessages$.subscribe(msg => {
        if (msg && !this.isNearBottom && msg.senderId !== this.currentUserId) {
          this.unreadSinceScroll++;
        }
      }),
      this.chatService.connected$.subscribe(status => this.isConnected = status)
    );
    this.loadMembers();
  }

  private loadMembers(): void {
    if (this.projectId) {
      this.membershipService.getMembers(this.projectId).subscribe({
        next: (members) => this.projectMembers = members,
        error: (err) => console.error('Failed to load members:', err)
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingScrollAttempts > 0) {
      this.scrollToBottom();
      this.pendingScrollAttempts--;
    }
  }

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    if (value && this.projectId) {
      this.shouldScrollToBottom = true;
      this.pendingScrollAttempts = 5; // Retry 5 view cycles to ensure DOM is ready
      this.connectToRoom();
    } else {
      this.showEmojiPicker = false;
      this.cancelReply();
    }
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  private connectToRoom(): void {
    this.chatService.getChatRoom(this.projectId).subscribe({
      next: (room) => {
        this.chatService.connect(room.id);
        this.subscribeToTyping(room.id);
      },
      error: (err) => console.error('Failed to get chat room:', err)
    });
  }

  private subscribeToTyping(roomId: number): void {
    const client = (this.chatService as any).stompClient;
    if (client && client.active) {
      client.subscribe(`/topic/typing/${roomId}`, (message: any) => {
        const data = JSON.parse(message.body);
        if (data.userId !== this.currentUserId) {
          this.addTypingUser(data.userName || 'Someone');
        }
      });
    }
  }

  private addTypingUser(name: string): void {
    if (!this.typingUsers.includes(name)) {
      this.typingUsers = [...this.typingUsers, name];
    }
    // Clear after 3s
    if (this.typingCleanupTimers.has(name)) {
      clearTimeout(this.typingCleanupTimers.get(name));
    }
    this.typingCleanupTimers.set(name, setTimeout(() => {
      this.typingUsers = this.typingUsers.filter(u => u !== name);
      this.typingCleanupTimers.delete(name);
    }, 3000));
  }

  onTyping(): void {
    if (this.typingTimeout) return;
    this.broadcastTyping();
    this.typingTimeout = setTimeout(() => { this.typingTimeout = null; }, 2000);
  }

  onInputKeyDown(event: KeyboardEvent): void {
    if (this.showMentionList) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.mentionSelectedIndex = Math.min(this.mentionSelectedIndex + 1, this.filteredMembers.length - 1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.mentionSelectedIndex = Math.max(this.mentionSelectedIndex - 1, 0);
        return;
      }
      if (event.key === 'Enter' && this.mentionSelectedIndex >= 0) {
        event.preventDefault();
        this.insertMention(this.filteredMembers[this.mentionSelectedIndex]);
        return;
      }
      if (event.key === 'Escape') {
        this.showMentionList = false;
        event.preventDefault();
        return;
      }
    }
    this.onTyping();
  }

  onInputChange(event: any): void {
    const value = this.newMessage;
    const cursor = event.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      this.mentionStartIndex = atIndex;
      this.mentionSearchTerm = textBeforeCursor.substring(atIndex + 1).toLowerCase();
      this.showMentionList = true;
      this.mentionSelectedIndex = 0;
      this.filterMembers();
    } else {
      this.showMentionList = false;
      this.mentionSelectedIndex = -1;
    }
  }

  private filterMembers(): void {
    this.filteredMembers = this.projectMembers.filter(m =>
      m.userName?.toLowerCase().includes(this.mentionSearchTerm)
    );
  }

  insertMention(member: Membership): void {
    const prefix = this.newMessage.substring(0, this.mentionStartIndex);
    const suffix = this.newMessage.substring(this.msgInput.nativeElement.selectionStart);
    this.newMessage = prefix + '@' + member.userName + ' ' + suffix;
    this.showMentionList = false;
    this.mentionSelectedIndex = -1;
    setTimeout(() => {
      const newCursor = prefix.length + member.userName!.length + 2;
      this.msgInput.nativeElement.focus();
      this.msgInput.nativeElement.setSelectionRange(newCursor, newCursor);
    });
  }

  onBlur(): void {
    this.inputFocused = false;
    // Delay hiding mention list to allow click events
    setTimeout(() => this.showMentionList = false, 200);
  }

  private broadcastTyping(): void {
    const client = (this.chatService as any).stompClient;
    const roomId = (this.chatService as any).currentRoomId;
    if (client?.active && roomId) {
      client.publish({
        destination: `/app/typing/${roomId}`,
        body: JSON.stringify({
          userId: this.currentUserId,
          userName: 'You'
        })
      });
    }
  }

  setReply(msg: ChatMessage): void {
    this.replyToMessage = msg;
    if (this.msgInput) {
      setTimeout(() => this.msgInput.nativeElement.focus());
    }
  }

  cancelReply(): void {
    this.replyToMessage = null;
  }

  send(): void {
    if ((!this.newMessage.trim() && this.selectedFiles.length === 0) || !this.isConnected) return;

    const filesToUpload = [...this.selectedFiles];
    const content = this.newMessage.trim();

    this.newMessage = '';
    this.selectedFiles = [];
    this.showEmojiPicker = false;

    const parentId = this.replyToMessage?.id;
    this.cancelReply();
    this.isNearBottom = true;

    this.chatService.sendMessage(content, parentId);

    if (filesToUpload.length > 0) {
      let sub: Subscription;
      sub = this.chatService.messages$.pipe(skip(1)).subscribe(msgs => {
        // Find the latest message from me
        const myMsg = [...msgs].reverse().find(m => m.senderId === this.currentUserId);

        if (myMsg && myMsg.id) {
          console.log('[DEBUG Chat] Found message for attachment upload:', myMsg.id);
          sub.unsubscribe();
          filesToUpload.forEach(file => {
            console.log('[DEBUG Chat] Uploading file:', file.name, 'to message:', myMsg.id);
            this.attachmentService.uploadChatMessageAttachment(myMsg.id!, file).subscribe({
              next: () => console.log('[DEBUG Chat] Upload initiated for', file.name),
              error: (err: any) => console.error('[DEBUG Chat] Upload failed for', file.name, err)
            });
          });
        }
      });
      setTimeout(() => {
        if (sub) {
          console.log('[DEBUG Chat] Attachment upload subscription timeout');
          sub.unsubscribe();
        }
      }, 10000);
    }
  }

  handleKeyDown(event: any): void {
    if (event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  insertEmoji(emoji: string): void {
    this.newMessage += emoji;
    // Focus back on input
    if (this.msgInput) {
      this.msgInput.nativeElement.focus();
    }
  }

  onScroll(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 40;
      this.isNearBottom = atBottom;

      if (atBottom) {
        this.unreadSinceScroll = 0;
      }
    }
  }

  jumpToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
      setTimeout(() => {
        this.unreadSinceScroll = 0;
        this.isNearBottom = true;
      }, 500);
    }
  }

  isCompact(index: number): boolean {
    if (index === 0) return false;
    if (this.shouldShowDate(index)) return false;
    const curr = this.messages[index];
    const prev = this.messages[index - 1];
    if (curr.senderId !== prev.senderId) return false;

    // Replies are never compact
    if (curr.parentMessageId) return false;

    if (curr.createdAt && prev.createdAt) {
      const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
      if (diff > 300000) return false; // 5 min gap breaks grouping
    }
    return true;
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;
    const curr = this.messages[index];
    const prev = this.messages[index - 1];
    if (!curr.createdAt || !prev.createdAt) return false;
    return new Date(curr.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  trackMessage(index: number, msg: ChatMessage): number | undefined {
    return msg.id;
  }

  scrollToMessage(msgId: number): void {
    const element = document.getElementById('msg-' + msgId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId = msgId;
      setTimeout(() => {
        if (this.highlightedMessageId === msgId) {
          this.highlightedMessageId = null;
        }
      }, 2000);
    }
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
    this.typingCleanupTimers.forEach(t => clearTimeout(t));

    // Revoke image URLs to prevent memory leaks
    this.loadedImageUrls.forEach(url => URL.revokeObjectURL(url));
    this.loadedImageUrls.clear();
  }

  // File Handling
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
      }
    }
    this.fileInput.nativeElement.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatSize(bytes: number): string {
    return this.attachmentService.getFileSizeDisplay(bytes);
  }

  getFileIcon(type?: string): string {
    if (!type) return 'insert_drive_file';
    if (this.isImage(type)) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('zip') || type.includes('compressed')) return 'folder_zip';
    return 'insert_drive_file';
  }

  isImage(type?: string): boolean {
    return !!type && type.startsWith('image/');
  }

  openZoom(att: Attachment): void {
    const url = this.loadedImageUrls.get(att.id);
    if (url) {
      this.zoomedImage = att;
      this.zoomedImageUrl = url;
    }
  }

  closeZoom(): void {
    this.zoomedImage = null;
    this.zoomedImageUrl = null;
  }

  private processImageAttachments(messages: ChatMessage[]): void {
    messages.forEach(msg => {
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (this.isImage(att.fileType) && !this.loadedImageUrls.has(att.id)) {
            // Pre-load image securely via blob
            this.attachmentService.download(att.id).subscribe({
              next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                this.loadedImageUrls.set(att.id, url);
              },
              error: (err) => console.error('Failed to load image preview:', att.fileName, err)
            });
          }
        });
      }
    });
  }

  downloadAttachment(att: Attachment): void {
    this.attachmentService.download(att.id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  renderMentions(text: string): SafeHtml {
    const selfName = this.projectMembers.find(m => m.userId === this.currentUserId)?.userName;
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = escaped.replace(/@(\S+)/g, (match, name) => {
      const isSelf = selfName && name.toLowerCase() === selfName.toLowerCase();
      const cls = isSelf ? 'mention-chip self' : 'mention-chip';
      return `<span class="${cls}">${match}</span>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Resizing logic
  startResizing(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
  }

  @HostListener('window:mousemove', ['$event'])
  onResize(event: MouseEvent): void {
    if (!this.isResizing) return;

    const newWidth = window.innerWidth - event.clientX;
    if (newWidth >= this.MIN_WIDTH && newWidth <= this.MAX_WIDTH) {
      this.chatWidth = newWidth;
    } else if (newWidth < this.MIN_WIDTH) {
      this.chatWidth = this.MIN_WIDTH;
    } else if (newWidth > this.MAX_WIDTH) {
      this.chatWidth = this.MAX_WIDTH;
    }
  }

  @HostListener('window:mouseup')
  stopResizing(): void {
    if (this.isResizing) {
      this.isResizing = false;
      localStorage.setItem('teamflow_chat_width', this.chatWidth.toString());
    }
  }
}

import { Component, OnInit, OnDestroy, Input, inject, ViewChild, ElementRef, AfterViewChecked, HostListener, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
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
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  @Input() projectId!: number;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('msgInput') private msgInput!: ElementRef;

  private _isOpen = false;
  isConnected = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId: number | null = null;
  currentUserName: string | null = null;
  inputFocused = false;
  showEmojiPicker = false;
  replyToMessage: ChatMessage | null = null;
  highlightedMessageId: number | null = null;
  unreadSinceScroll: number = 0;
  showMembersPanel = false;
  public isNearBottom = true;

  typingUsers: string[] = [];
  private typingTimeout: any;
  private typingCleanupTimers: Map<string, any> = new Map();

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private membershipService = inject(MembershipService);
  private attachmentService = inject(AttachmentService);
  private sanitizer = inject(DomSanitizer);
  private subs: Subscription[] = [];

  loadedImageUrls: Map<number, string> = new Map();

  zoomedImage: Attachment | null = null;
  zoomedImageUrl: string | null = null;

  selectedFiles: File[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef;

  projectMembers: Membership[] = [];
  filteredMembers: Membership[] = [];
  showMentionList = false;
  mentionSearchTerm = '';
  mentionStartIndex = -1;
  mentionSelectedIndex = -1;

  chatWidth = 440;
  isResizing = false;
  private readonly MIN_WIDTH = 320;
  private readonly MAX_WIDTH = 800;

  private shouldScrollToBottom = false;
  private pendingScrollAttempts = 0;

  emojis = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥',
    '🎉', '🚀', '💯', '✅', '❌', '⭐', '💡', '📌', '🙏', '👋',
    '😊', '🤣', '😘', '🥳', '🤩', '😢', '😤', '🫡', '🤝', '💪',
    '🎯', '⚡', '🌟', '💎', '🏆', '📎', '💻', '🎨', '🛠️', '📝'
  ];

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

    const savedWidth = localStorage.getItem('teamflow_chat_width');
    if (savedWidth) {
      this.chatWidth = Math.min(Math.max(parseInt(savedWidth, 10), this.MIN_WIDTH), this.MAX_WIDTH);
    }

    this.subs.push(
      this.chatService.messages$.pipe(
        tap((msgs) => {
          this.processImageAttachments(msgs);
          msgs.forEach(m => {
            (m as any).safeContent = this.renderMentions(m.content);
          });

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      console.log('[Chat] Project changed, reloading members:', this.projectId);
      this.loadMembers();
    }
  }

  private loadMembers(): void {
    if (this.projectId) {
      this.membershipService.getMembers(this.projectId).subscribe({
        next: (members) => {
          const me = members.find(m => m.userId === this.currentUserId);
          if (me) this.currentUserName = me.userName;

          this.projectMembers = members;

          this.messages.forEach(m => {
            m.safeContent = this.renderMentions(m.content);
          });
        },
        error: (err) => console.error('[Chat] Failed to load members:', err)
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
      this.pendingScrollAttempts = 5;
      this.connectToRoom();
    } else {
      this.showEmojiPicker = false;
      this.showMembersPanel = false;
      this.cancelReply();
    }
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  toggleMembersPanel(): void {
    this.showMembersPanel = !this.showMembersPanel;
    if (this.showMembersPanel) {
      this.showEmojiPicker = false;
    }
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
    const value = event.target.value;
    this.newMessage = value;
    const cursor = event.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ' || textBeforeCursor[atIndex - 1] === '\n')) {
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
    const term = this.mentionSearchTerm.toLowerCase();

    const everyone: any = { userName: 'everyone', roleInProject: 'All Project Members', userId: -1 };
    const matchesEveryone = 'everyone'.includes(term);

    this.filteredMembers = this.projectMembers.filter(m =>
      m.userName?.toLowerCase().includes(term) && m.userId !== this.currentUserId
    );

    if (matchesEveryone) {
      this.filteredMembers = [everyone, ...this.filteredMembers];
    }
  }

  insertMention(member: Membership): void {
    const currentVal = this.msgInput.nativeElement.value;
    const prefix = currentVal.substring(0, this.mentionStartIndex);
    const suffix = currentVal.substring(this.msgInput.nativeElement.selectionStart);
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

    if (curr.parentMessageId) return false;

    if (curr.createdAt && prev.createdAt) {
      const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
      if (diff > 300000) return false;
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

  scrollToMessage(msgId: number, retryCount = 0): void {
    const element = document.getElementById('msg-' + msgId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId = msgId;
      setTimeout(() => {
        if (this.highlightedMessageId === msgId) {
          this.highlightedMessageId = null;
        }
      }, 2000);
    } else if (retryCount < 10) {
      setTimeout(() => this.scrollToMessage(msgId, retryCount + 1), 300);
    }
  }


  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chatService.disconnect();
    this.typingCleanupTimers.forEach(t => clearTimeout(t));

    this.loadedImageUrls.forEach(url => URL.revokeObjectURL(url));
    this.loadedImageUrls.clear();
  }

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
    if (!text) return '';

    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (/@everyone/gi.test(html)) {
      html = html.replace(/@everyone/gi, (match) => {
        return `<span class="mention-chip everyone">${match}</span>`;
      });
    }

    if (this.projectMembers.length > 0) {
      const sortedMembers = [...this.projectMembers].sort((a, b) => (b.userName?.length || 0) - (a.userName?.length || 0));

      sortedMembers.forEach(member => {
        if (!member.userName) return;
        const name = member.userName;
        const isSelf = member.userId == this.currentUserId;
        const cls = isSelf ? 'mention-chip self' : 'mention-chip';

        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}\\b`, 'gi');

        if (regex.test(html)) {
          html = html.replace(regex, (match) => `<span class="${cls}">${match}</span>`);
        }
      });
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

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

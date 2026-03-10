import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MembershipService } from '../../../../core/services/membership.service';
import { UserService } from '../../../../core/services/user.service';
import { Membership, User } from '../../../../shared/models';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map } from 'rxjs';

@Component({
    selector: 'app-members-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatListModule,
        MatListModule,
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './members-dialog.component.html',
    styles: [`
    .member-item {
      @apply flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50;
    }
  `]
})
export class MembersDialogComponent implements OnInit {
    members: Membership[] = [];
    searchControl = new FormControl('');
    searchResults: User[] = [];
    selectedUser: User | null = null;
    selectedRole: 'MANAGER' | 'MEMBER' = 'MEMBER';

    private membershipService = inject(MembershipService);
    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);

    constructor(
        public dialogRef: MatDialogRef<MembersDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { projectId: number }
    ) { }

    ngOnInit(): void {
        this.loadMembers();

        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                if (!query || query.length < 2) return of({ content: [] as User[], last: true, totalElements: 0, size: 0, number: 0, totalPages: 0, first: true, numberOfElements: 0, empty: true, sort: { empty: true, sorted: false, unsorted: true }, pageable: { sort: { empty: true, sorted: false, unsorted: true }, offset: 0, pageNumber: 0, pageSize: 0, paged: true, unpaged: false } });
                return this.userService.searchUsers(query).pipe(
                    catchError(() => of({ content: [] as User[], last: true, totalElements: 0, size: 0, number: 0, totalPages: 0, first: true, numberOfElements: 0, empty: true, sort: { empty: true, sorted: false, unsorted: true }, pageable: { sort: { empty: true, sorted: false, unsorted: true }, offset: 0, pageNumber: 0, pageSize: 0, paged: true, unpaged: false } }))
                );
            }),
            map(response => response.content)
        ).subscribe(users => {
            // Filter out users who are already members
            const memberIds = this.members.map(m => m.userId);
            this.searchResults = users.filter(u => !memberIds.includes(u.id));
        });
    }

    loadMembers(): void {
        this.membershipService.getMembers(this.data.projectId).subscribe({
            next: (members) => this.members = members,
            error: () => this.snackBar.open('Failed to load members', 'Close', { duration: 3000 })
        });
    }

    selectUser(user: User): void {
        this.selectedUser = user;
        this.searchResults = [];
        this.searchControl.setValue(user.fullName, { emitEvent: false });
    }

    addMember(): void {
        if (!this.selectedUser) return;

        this.membershipService.addMember(this.data.projectId, this.selectedUser.id, this.selectedRole)
            .subscribe({
                next: (newMember) => {
                    this.members.push(newMember);
                    this.selectedUser = null;
                    this.searchControl.setValue('');
                    this.snackBar.open('Member added successfully', 'Close', { duration: 3000 });
                },
                error: () => this.snackBar.open('Failed to add member', 'Close', { duration: 3000 })
            });
    }

    removeMember(member: Membership): void {
        if (!confirm(`Remove ${member.userName} from project?`)) return;

        this.membershipService.removeMember(member.id).subscribe({
            next: () => {
                this.members = this.members.filter(m => m.id !== member.id);
                this.snackBar.open('Member removed', 'Close', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to remove member', 'Close', { duration: 3000 })
        });
    }

    updateMemberRole(member: Membership, newRole: 'MANAGER' | 'MEMBER'): void {
        if (member.roleInProject === newRole) return;

        this.membershipService.updateRole(member.id, newRole).subscribe({
            next: (updated) => {
                member.roleInProject = updated.roleInProject;
                this.snackBar.open(`Role updated to ${newRole}`, 'Close', { duration: 2000 });
            },
            error: () => this.snackBar.open('Failed to update role', 'Close', { duration: 3000 })
        });
    }
}

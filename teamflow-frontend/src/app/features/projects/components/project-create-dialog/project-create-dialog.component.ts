import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectService } from '../../../../core/services/project.service';
import { Project, User, Membership } from '../../../../shared/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../core/services/user.service';
import { MembershipService } from '../../../../core/services/membership.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-project-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './project-create-dialog.component.html'
})
export class ProjectCreateDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  step = 1;
  createdProject: Project | null = null;
  members: Membership[] = [];
  searchControl = new FormControl('');
  searchResults: User[] = [];
  selectedUser: User | null = null;

  private userService = inject(UserService);
  private membershipService = inject(MembershipService);

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private dialogRef: MatDialogRef<ProjectCreateDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      startDate: [null, [this.futureDateValidator]],
      endDate: [null, [this.futureDateValidator]],
      type: ['PERSONAL', Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  futureDateValidator(control: FormControl): { [key: string]: boolean } | null {
    if (control.value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(control.value) < today) {
        return { futureDate: true };
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        const empty = { content: [] as User[], last: true, totalElements: 0, size: 0, number: 0, totalPages: 0, first: true, numberOfElements: 0, empty: true, sort: { empty: true, sorted: false, unsorted: true }, pageable: { sort: { empty: true, sorted: false, unsorted: true }, offset: 0, pageNumber: 0, pageSize: 0, paged: true, unpaged: false } };
        if (!query || query.length < 2) return of(empty);
        return this.userService.searchUsers(query).pipe(
          catchError(() => of(empty))
        );
      }),
      map(response => response.content)
    ).subscribe(users => {
      const memberIds = this.members.map(m => m.userId);
      this.searchResults = users.filter((u: User) => !memberIds.includes(u.id));
    });
  }

  dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && new Date(start) > new Date(end)) {
      return { dateRange: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const projectData = { ...this.form.value, status: 'ACTIVE' };

    this.projectService.createProject(projectData).subscribe({
      next: (project) => {
        if (projectData.type === 'TEAM') {
          this.step = 2;
          this.createdProject = project;
          this.loading = false;
          this.loadMembers(project.id);
          this.snackBar.open('Project created! Invite your team.', 'Close', { duration: 3000 });
        } else {
          this.dialogRef.close(project);
          this.snackBar.open('Project created successfully', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to create project', 'Close', { duration: 3000 });
        console.error('Error creating project:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  loadMembers(projectId: number): void {
    this.membershipService.getMembers(projectId).subscribe({
      next: (members) => this.members = members,
      error: () => console.error('Failed to load members')
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.searchResults = [];
    this.searchControl.setValue(user.fullName, { emitEvent: false });
  }

  addMember(): void {
    if (!this.selectedUser || !this.createdProject) return;

    this.membershipService.addMember(this.createdProject.id, this.selectedUser.id, 'MEMBER')
      .subscribe({
        next: (newMember) => {
          this.members.push(newMember);
          this.selectedUser = null;
          this.searchControl.setValue('');
          this.snackBar.open('Member invited!', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to invite member', 'Close', { duration: 3000 })
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

  onFinish(): void {
    this.dialogRef.close(this.createdProject);
  }
}

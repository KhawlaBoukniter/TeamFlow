
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
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

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
  template: `
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <mat-icon class="text-indigo-600" style="font-size: 24px; width: 24px; height: 24px;">create_new_folder</mat-icon>
        <h2 class="text-lg font-semibold m-0" style="line-height: 24px;">
            {{ step === 1 ? 'Create New Project' : 'Invite Team Members' }}
        </h2>
      </div>
    </div>

    <!-- Step 1: Create Project -->
    <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="step === 1">
      <mat-dialog-content class="flex flex-col gap-5 min-w-[500px]">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Project Name *</mat-label>
          <input matInput formControlName="name" placeholder="Ex: TeamFlow Redesign">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Name must be at least 3 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Describe your project..."></textarea>
          <mat-hint>Optional - Add project details and goals</mat-hint>
        </mat-form-field>

        <!-- Settings -->
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Project Type *</mat-label>
            <mat-select formControlName="type">
              <mat-option value="PERSONAL">Personal</mat-option>
              <mat-option value="TEAM">Team</mat-option>
            </mat-select>
            <mat-hint>Choose collaboration level</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status *</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="ARCHIVED">Archived</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex gap-4">
            <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
        </div>

        <mat-error *ngIf="form.hasError('dateRange') && (form.get('startDate')?.touched || form.get('endDate')?.touched)" class="text-sm">
            End date must be after start date
        </mat-error>

      </mat-dialog-content>
      <mat-dialog-actions align="end" class="gap-3 px-6 pb-6">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Creating...' : (form.get('type')?.value === 'TEAM' ? 'Next: Invite Members' : 'Create Project') }}
        </button>
      </mat-dialog-actions>
    </form>

    <!-- Step 2: Invite Members (Team Only) -->
    <div *ngIf="step === 2" class="flex flex-col h-full">
        <mat-dialog-content class="!p-0 min-w-[500px] flex flex-col">
            <div class="p-6 pb-2">
                <p class="text-sm text-gray-600 mb-4">
                    Your project <strong>{{ createdProject?.name }}</strong> has been created! Invite your team now or skip this step.
                </p>
                
                <h3 class="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Invite Member</h3>
                
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <div class="flex flex-col gap-3">
                        <div class="relative">
                            <input [formControl]="searchControl" 
                                   class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                   placeholder="Search by name or email to invite...">
                            <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 !text-[20px]">search</mat-icon>
                            
                            <!-- Search Results Dropdown -->
                            <div *ngIf="searchResults.length > 0" 
                                 class="absolute top-12 left-0 right-0 bg-white shadow-xl border border-gray-100 rounded-lg max-h-48 overflow-auto z-50">
                                <div *ngFor="let user of searchResults" 
                                     (click)="selectUser(user)"
                                     class="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors">
                                    <div>
                                        <div class="font-medium text-sm text-gray-900">{{ user.fullName }}</div>
                                        <div class="text-xs text-gray-500">{{ user.email }}</div>
                                    </div>
                                    <mat-icon class="text-indigo-500 !w-5 !h-5 !text-[20px]">add_circle_outline</mat-icon>
                                </div>
                            </div>
                        </div>

                        <!-- Selected User Preview & Action -->
                        <div *ngIf="selectedUser" class="flex items-center gap-3 animate-slideUp">
                            <div class="flex-1 flex items-center gap-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                <div class="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                    {{ selectedUser.fullName.charAt(0) }}
                                </div>
                                <div class="overflow-hidden">
                                    <div class="font-medium text-sm text-indigo-900 truncate">{{ selectedUser.fullName }}</div>
                                    <div class="text-xs text-indigo-600 truncate">{{ selectedUser.email }}</div>
                                </div>
                            </div>

                            <button mat-flat-button color="primary" (click)="addMember()" class="!rounded-lg h-[36px]">
                                Invite
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Members List -->
                <h3 class="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex justify-between items-center">
                    Project Members
                    <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-[10px]">{{ members.length }}</span>
                </h3>
            </div>

            <!-- Scrollable List -->
            <div class="flex-1 overflow-y-auto px-6 pb-6 max-h-[250px]">
                <div class="space-y-3">
                    <div *ngFor="let member of members" class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm hover:border-gray-200 transition-all group">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shadow-inner border-2 border-white">
                                {{ member.userName.charAt(0) }}
                            </div>
                            <div>
                                <div class="font-medium text-sm text-gray-900">{{ member.userName }}</div>
                                <div class="text-xs text-gray-500">{{ member.roleInProject }}</div>
                            </div>
                        </div>
                    
                        <!-- Only allow removing if not self (usually owner is manager) -->
                        <button mat-icon-button (click)="removeMember(member)" 
                                class="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all !w-8 !h-8 !flex !items-center !justify-center"
                                matTooltip="Remove Member">
                            <mat-icon class="!text-[18px] !w-[18px] !h-[18px] !leading-[18px] m-0">delete_outline</mat-icon>
                        </button>
                    </div>

                    <div *ngIf="members.length === 0" class="flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p class="text-xs text-gray-400">Owner will be added automatically.</p>
                    </div>
                </div>
            </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="gap-3 px-6 pb-6 border-t border-gray-200 pt-4 bg-gray-50 rounded-b-xl">
             <button mat-button (click)="onFinish()">Skip</button>
             <button mat-flat-button color="primary" (click)="onFinish()">Done</button>
        </mat-dialog-actions>
    </div>
  `
})
export class ProjectCreateDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;

  // Wizard State
  step = 1;
  createdProject: Project | null = null;

  // Member Management State
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
      startDate: [null],
      endDate: [null],
      status: ['ACTIVE', Validators.required],
      type: ['PERSONAL', Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  ngOnInit(): void {
    // Setup user search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.userService.searchUsers(query).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(users => {
      // Filter out existing members
      const memberIds = this.members.map(m => m.userId);
      this.searchResults = users.filter(u => !memberIds.includes(u.id));
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
    const projectData = this.form.value;

    this.projectService.createProject(projectData).subscribe({
      next: (project) => {
        if (projectData.type === 'TEAM') {
          // Move to Step 2
          this.step = 2;
          this.createdProject = project;
          this.loading = false;
          this.loadMembers(project.id);
          this.snackBar.open('Project created! Invite your team.', 'Close', { duration: 3000 });
        } else {
          // Close immediately for Personal projects
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

  // --- Step 2 Logic ---

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

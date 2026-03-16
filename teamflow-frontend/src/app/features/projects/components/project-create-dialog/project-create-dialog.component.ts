
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
  template: `
    <!-- Linear Style Container -->
    <div class="flex flex-col max-h-[85vh] w-full bg-[#1C1C1E] text-[#EDEDED] font-sans rounded-xl overflow-hidden">
      
      <!-- Window Controls (Top) -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0">
         <!-- Breadcrumbs (Mocked for visual match) -->
         <div class="flex items-center gap-2 text-[13px] text-[#8A8F98]">
            <div class="px-1.5 py-0.5 rounded bg-[#2E3035] text-[#EDEDED] text-[11px] font-medium border border-white/5">MY</div>
            <span>›</span>
            <span class="text-[#EDEDED]">New project</span>
         </div>
         <button mat-icon-button type="button" (click)="onCancel()" class="text-[#8A8F98] hover:text-[#EDEDED] -mr-2">
            <mat-icon class="!w-5 !h-5 !text-[20px]">close</mat-icon>
         </button>
      </div>

      <!-- Step 1: Create Project Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="step === 1" class="flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-w-[750px]">
            
            <!-- Header Area -->
            <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl border border-white/10 bg-[#2C2D32] flex items-center justify-center text-[#8A8F98]">
                    <mat-icon class="!w-6 !h-6 !text-[24px]">inventory_2</mat-icon>
                </div>

                <!-- Title Input (Large) -->
                <div class="space-y-2">
                    <input matInput formControlName="name" 
                           class="w-full bg-transparent border-none p-0 text-4xl font-semibold placeholder-[#46484E] focus:ring-0 focus:outline-none text-[#EDEDED]" 
                           placeholder="Project name">
                    <div *ngIf="form.get('name')?.hasError('required') && form.get('name')?.touched" class="text-red-500 text-xs">Title is required</div>
                </div>

                <!-- Description Summary Input -->
                <input matInput formControlName="description" 
                       class="w-full bg-transparent border-none p-0 text-lg text-[#8A8F98] placeholder-[#46484E] focus:ring-0 focus:outline-none"
                       placeholder="Add a short summary...">
            </div>

            <!-- Attributes Row (Badges) -->
            <div class="flex flex-wrap items-center gap-2">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 transition-colors">
                        <mat-icon class="!w-4 !h-4 !text-[16px] text-emerald-500">radio_button_checked</mat-icon>
                        <span class="text-[13px] font-medium text-emerald-500">Active</span>
                    </div>

                 <!-- Type Badge (RESTORED) -->
                 <div class="relative group">
                    <mat-select formControlName="type" panelClass="linear-panel" class="opacity-0 absolute inset-0 cursor-pointer z-10 w-full h-full">
                        <mat-option value="PERSONAL">Personal</mat-option>
                        <mat-option value="TEAM">Team</mat-option>
                    </mat-select>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                        <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">
                            {{ form.get('type')?.value === 'TEAM' ? 'group' : 'person' }}
                        </mat-icon>
                        <span class="text-[13px] font-medium text-[#EDEDED]">{{ form.get('type')?.value | titlecase }}</span>
                    </div>
                 </div>

                 <!-- Lead (Owner) -->
                 <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                    <div class="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold">ME</div>
                    <span class="text-[13px] font-medium text-[#EDEDED]">Lead</span>
                 </div>

                 <!-- Members (Only if Team) -->
                 <div *ngIf="form.get('type')?.value === 'TEAM'" class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">group_add</mat-icon>
                    <span class="text-[13px] font-medium text-[#EDEDED]">Members</span>
                 </div>

                 <!-- Date Badges -->
                 <div class="flex flex-col gap-1">
                    <div class="relative flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent transition-colors cursor-pointer"
                         [ngClass]="(form.get('startDate')?.invalid && form.get('startDate')?.touched) ? 'border-red-500/50' : 'hover:border-[#3A3C42]'"
                         (click)="startPicker.open()">
                        <mat-icon class="!w-4 !h-4 !text-[16px]" [ngClass]="(form.get('startDate')?.invalid && form.get('startDate')?.touched) ? 'text-red-400' : 'text-[#8A8F98]'">calendar_today</mat-icon>
                        <span class="text-[13px] font-medium" [ngClass]="{'text-[#EDEDED]': form.get('startDate')?.value, 'text-[#8A8F98]': !form.get('startDate')?.value, 'text-red-400': (form.get('startDate')?.invalid && form.get('startDate')?.touched)}">
                            {{ (form.get('startDate')?.value | date:'MMM d') || 'Start' }}
                        </span>
                        <input matInput [matDatepicker]="startPicker" formControlName="startDate" class="absolute opacity-0 w-0 h-0 bottom-0 left-0 pointer-events-none">
                        <mat-datepicker #startPicker panelClass="linear-datepicker"></mat-datepicker>
                    </div>
                 </div>

                 <div class="flex flex-col gap-1">
                    <div class="relative flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent transition-colors cursor-pointer"
                         [ngClass]="(form.get('endDate')?.invalid && form.get('endDate')?.touched) ? 'border-red-500/50' : 'hover:border-[#3A3C42]'"
                         (click)="endPicker.open()">
                        <mat-icon class="!w-4 !h-4 !text-[16px]" [ngClass]="(form.get('endDate')?.invalid && form.get('endDate')?.touched) ? 'text-red-400' : 'text-[#8A8F98]'">event</mat-icon>
                        <span class="text-[13px] font-medium" [ngClass]="{'text-[#EDEDED]': form.get('endDate')?.value, 'text-[#8A8F98]': !form.get('endDate')?.value, 'text-red-400': (form.get('endDate')?.invalid && form.get('endDate')?.touched)}">
                            {{ (form.get('endDate')?.value | date:'MMM d') || 'Target' }}
                        </span>
                        <input matInput [matDatepicker]="endPicker" formControlName="endDate" class="absolute opacity-0 w-0 h-0 bottom-0 left-0 pointer-events-none">
                        <mat-datepicker #endPicker panelClass="linear-datepicker"></mat-datepicker>
                    </div>
                 </div>
            </div>

            <!-- Error Messages Container -->
            <div class="px-1 space-y-1" *ngIf="form.touched">
                <p *ngIf="form.get('startDate')?.hasError('futureDate')" class="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <mat-icon class="!text-[12px] !w-3 !h-3">warning</mat-icon> Start date must be in the future
                </p>
                <p *ngIf="form.get('endDate')?.hasError('futureDate')" class="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <mat-icon class="!text-[12px] !w-3 !h-3">warning</mat-icon> Target date must be in the future
                </p>
                <p *ngIf="form.hasError('dateRange')" class="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <mat-icon class="!text-[12px] !w-3 !h-3">priority_high</mat-icon> Target date cannot be before start date
                </p>
            </div>

            <div class="h-px bg-[#2E3035] w-full"></div>

            <!-- Extended Description -->
             <div class="">
                <textarea class="w-full bg-transparent text-[#EDEDED] placeholder-[#46484E] text-[15px] resize-none focus:outline-none h-48 leading-relaxed" 
                          formControlName="description"
                          placeholder="Write a description, a project brief, or collect ideas..."></textarea>
             </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-[#2E3035] bg-[#1C1C1E] flex justify-end gap-3 rounded-b-lg">
            <button mat-button type="button" (click)="onCancel()" class="!text-white !bg-[#33353A] hover:!bg-[#404249] border border-[#45484F] rounded-md px-4 h-9 font-medium transition-all shadow-sm">Cancel</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading" class="!bg-[#5E6AD2] hover:!bg-[#4e5ac0] !text-white !rounded-md px-4 h-9 font-medium">
                 {{ loading ? 'Creating...' : (form.get('type')?.value === 'TEAM' ? 'Next: Invite Team' : 'Create project') }}
            </button>
        </div>
      </form>

      <!-- Step 2: Invite Members (Retained logic, updated style) -->
      <div *ngIf="step === 2" class="flex flex-col h-full bg-[#1C1C1E]">
            <div class="p-6 pb-2 text-[#EDEDED]">
                <p class="text-[13px] text-[#8A8F98] mb-4">
                    Project <span class="text-[#EDEDED] font-medium">{{ createdProject?.name }}</span> created. Invite your team.
                </p>
                
                <div class="bg-[#2C2D32] p-4 rounded-lg border border-[#2E3035] mb-6">
                    <div class="relative">
                        <input [formControl]="searchControl" 
                               class="w-full pl-9 pr-4 py-2 bg-[#1C1C1E] border border-[#2E3035] rounded-md text-sm text-[#EDEDED] focus:outline-none focus:border-brand-500 placeholder-[#46484E]"
                               placeholder="Search members...">
                        <mat-icon class="absolute left-2.5 top-2.5 text-[#8A8F98] !w-4 !h-4 !text-[16px]">search</mat-icon>
                        
                        <!-- Dropdown -->
                        <div *ngIf="searchResults.length > 0" class="absolute top-10 left-0 right-0 bg-[#2C2D32] border border-[#2E3035] shadow-xl rounded-md z-50">
                             <div *ngFor="let user of searchResults" (click)="selectUser(user)" class="p-2 hover:bg-[#3A3C42] cursor-pointer flex items-center justify-between">
                                <span class="text-sm text-[#EDEDED]">{{ user.fullName }}</span>
                                <mat-icon class="text-brand-500 !w-4 !h-4 !text-[16px]">add</mat-icon>
                             </div>
                        </div>
                    </div>
                    
                    <!-- Selected -->
                    <div *ngIf="selectedUser" class="flex items-center gap-3 mt-3 animate-slideUp">
                         <span class="text-sm text-[#EDEDED] font-medium flex-1">{{ selectedUser.fullName }}</span>
                         <button mat-button color="primary" (click)="addMember()">Invite</button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto max-h-[200px] space-y-2">
                    <div *ngFor="let member of members" class="flex items-center justify-between p-2 rounded-md hover:bg-[#2C2D32] group">
                        <div class="flex items-center gap-3">
                             <div class="w-6 h-6 rounded bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold">
                                {{ member.userName.charAt(0) }}
                             </div>
                             <span class="text-sm text-[#EDEDED]">{{ member.userName }}</span>
                        </div>
                        <button mat-icon-button (click)="removeMember(member)" class="text-[#8A8F98] opacity-0 group-hover:opacity-100 hover:text-red-500 !w-6 !h-6">
                            <mat-icon class="!text-[16px]">close</mat-icon>
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-[#2E3035] bg-[#1C1C1E] flex justify-end gap-3 mt-auto">
                 <button mat-button (click)="onFinish()" class="text-[#8A8F98]">Skip</button>
                 <button mat-flat-button color="primary" (click)="onFinish()">Done</button>
            </div>
      </div>

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
    // Setup user search
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
      // Filter out existing members
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

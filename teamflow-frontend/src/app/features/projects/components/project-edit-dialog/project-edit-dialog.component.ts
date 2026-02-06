import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../shared/models';

@Component({
    selector: 'app-project-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule,
        MatIconModule
    ],
    template: `
    <!-- Linear Style Container -->
    <div class="flex flex-col max-h-[85vh] w-full bg-[#1C1C1E] text-[#EDEDED] font-sans rounded-xl overflow-hidden">
      
      <!-- Window Controls (Top) -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0">
         <!-- Breadcrumbs -->
         <div class="flex items-center gap-2 text-[13px] text-[#8A8F98]">
            <div class="px-1.5 py-0.5 rounded bg-[#2E3035] text-[#EDEDED] text-[11px] font-medium border border-white/5">MY</div>
            <span>›</span>
            <span class="text-[#EDEDED]">Edit project</span>
         </div>
         <button mat-icon-button type="button" (click)="onCancel()" class="text-[#8A8F98] hover:text-[#EDEDED] -mr-2">
            <mat-icon class="!w-5 !h-5 !text-[20px]">close</mat-icon>
         </button>
      </div>

      <!-- Edit Form -->
      <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-8 py-6 space-y-8 min-w-[750px]">
            
            <!-- Header Area -->
            <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl border border-white/10 bg-[#2C2D32] flex items-center justify-center text-[#8A8F98]">
                    <mat-icon class="!w-6 !h-6 !text-[24px]">edit</mat-icon>
                </div>

                <!-- Title Input (Large) -->
                <div class="space-y-2">
                    <input matInput formControlName="name" 
                           class="w-full bg-transparent border-none p-0 text-4xl font-semibold placeholder-[#46484E] focus:ring-0 focus:outline-none text-[#EDEDED]" 
                           placeholder="Project name">
                    <div *ngIf="projectForm.get('name')?.hasError('required') && projectForm.get('name')?.touched" class="text-red-500 text-xs">Title is required</div>
                </div>
            </div>

            <!-- Attributes Row (Badges) -->
            <div class="flex flex-wrap items-center gap-2">
                <!-- Status Badge -->
                 <div class="relative group">
                    <mat-select formControlName="status" panelClass="linear-panel" class="opacity-0 absolute inset-0 cursor-pointer z-10 w-full h-full">
                        <mat-option value="ACTIVE">Active</mat-option>
                        <mat-option value="ARCHIVED">Archived</mat-option>
                    </mat-select>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                        <mat-icon class="!w-4 !h-4 !text-[16px]" 
                            [ngClass]="{'text-emerald-500': projectForm.get('status')?.value === 'ACTIVE', 'text-gray-500': projectForm.get('status')?.value === 'ARCHIVED'}">
                            {{ projectForm.get('status')?.value === 'ACTIVE' ? 'radio_button_checked' : 'archive' }}
                        </mat-icon>
                        <span class="text-[13px] font-medium text-[#EDEDED]">{{ projectForm.get('status')?.value | titlecase }}</span>
                    </div>
                 </div>

                 <!-- Type Badge (RESTORED) -->
                 <div class="relative group">
                    <mat-select formControlName="type" panelClass="linear-panel" class="opacity-0 absolute inset-0 cursor-pointer z-10 w-full h-full">
                        <mat-option value="PERSONAL">Personal</mat-option>
                        <mat-option value="TEAM">Team</mat-option>
                    </mat-select>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                        <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">
                            {{ projectForm.get('type')?.value === 'TEAM' ? 'group' : 'person' }}
                        </mat-icon>
                        <span class="text-[13px] font-medium text-[#EDEDED]">{{ projectForm.get('type')?.value | titlecase }}</span>
                    </div>
                 </div>

                 <!-- Priority (Visual Mock) -->
                 <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">signal_cellular_alt</mat-icon>
                    <span class="text-[13px] font-medium text-[#8A8F98]">No priority</span>
                 </div>

                 <!-- Lead (Owner) -->
                 <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                    <div class="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold">ME</div>
                    <span class="text-[13px] font-medium text-[#EDEDED]">Lead</span>
                 </div>

                 <!-- Members (Visual Mock) -->
                 <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">group</mat-icon>
                    <span class="text-[13px] font-medium text-[#8A8F98]">Members</span>
                 </div>

                 <!-- Date Badges -->
                 <div class="relative flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer"
                      (click)="startPicker.open()">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">calendar_today</mat-icon>
                    <span class="text-[13px] font-medium" [ngClass]="{'text-[#EDEDED]': projectForm.get('startDate')?.value, 'text-[#8A8F98]': !projectForm.get('startDate')?.value}">
                        {{ (projectForm.get('startDate')?.value | date:'MMM d') || 'Start' }}
                    </span>
                    <!-- Invisible input for anchor positioning -->
                    <input matInput [matDatepicker]="startPicker" formControlName="startDate" class="absolute opacity-0 w-0 h-0 bottom-0 left-0 pointer-events-none">
                    <mat-datepicker #startPicker panelClass="linear-datepicker"></mat-datepicker>
                 </div>

                 <div class="relative flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2D32]/50 hover:bg-[#2C2D32] border border-transparent hover:border-[#3A3C42] transition-colors cursor-pointer"
                      (click)="endPicker.open()">
                    <mat-icon class="!w-4 !h-4 !text-[16px] text-[#8A8F98]">event</mat-icon>
                    <span class="text-[13px] font-medium" [ngClass]="{'text-[#EDEDED]': projectForm.get('endDate')?.value, 'text-[#8A8F98]': !projectForm.get('endDate')?.value}">
                        {{ (projectForm.get('endDate')?.value | date:'MMM d') || 'Target' }}
                    </span>
                    <!-- Invisible input for anchor positioning -->
                    <input matInput [matDatepicker]="endPicker" formControlName="endDate" class="absolute opacity-0 w-0 h-0 bottom-0 left-0 pointer-events-none">
                    <mat-datepicker #endPicker panelClass="linear-datepicker"></mat-datepicker>
                 </div>
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
            <button mat-flat-button color="primary" type="submit" [disabled]="projectForm.invalid || loading" class="!bg-[#5E6AD2] hover:!bg-[#4e5ac0] !text-white !rounded-md px-4 h-9 font-medium">
                 {{ loading ? 'Updating...' : 'Save changes' }}
            </button>
        </div>
      </form>
    </div>
  `
})
export class ProjectEditDialogComponent {
    projectForm: FormGroup;
    loading = false;
    project: Project;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { project: Project },
        private dialogRef: MatDialogRef<ProjectEditDialogComponent>,
        private fb: FormBuilder,
        private projectService: ProjectService,
        private snackBar: MatSnackBar
    ) {
        this.project = data.project;

        this.projectForm = this.fb.group({
            name: [this.project.name, [Validators.required, Validators.minLength(3)]],
            description: [this.project.description || ''],
            type: [this.project.type || 'PERSONAL'],
            status: [this.project.status || 'ACTIVE'],
            startDate: [this.project.startDate ? new Date(this.project.startDate) : null],
            endDate: [this.project.endDate ? new Date(this.project.endDate) : null]
        }, { validators: this.dateRangeValidator });
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
        if (this.projectForm.invalid) return;

        this.loading = true;
        const formValue = this.projectForm.value;

        // Convert dates to ISO strings
        const updateData: Partial<Project> = {
            ...formValue,
            startDate: formValue.startDate ? new Date(formValue.startDate).toISOString().split('T')[0] : null,
            endDate: formValue.endDate ? new Date(formValue.endDate).toISOString().split('T')[0] : null
        };

        this.projectService.updateProject(this.project.id, updateData).subscribe({
            next: (updatedProject) => {
                this.loading = false;
                this.snackBar.open('Project updated successfully', 'Close', { duration: 2000 });
                this.dialogRef.close(updatedProject);
            },
            error: (err) => {
                this.loading = false;
                console.error('Failed to update project', err);
                this.snackBar.open('Failed to update project', 'Close', { duration: 3000 });
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-task-dialog',
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
    MatIconModule
  ],
  template: `
    <div class="px-6 py-4 border-b border-[#2E3035] flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#2C2D32] flex items-center justify-center">
        <mat-icon class="text-brand !text-[18px]" style="width:18px;height:18px;">add_task</mat-icon>
      </div>
      <h2 class="text-base font-semibold text-white m-0">Create New Task</h2>
    </div>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-4 !min-w-[520px]">
        <mat-form-field appearance="outline" class="w-full linear-form-field">
          <mat-label>Task Title *</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Fix Navigation">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full linear-form-field">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Task details..."></textarea>
          <mat-hint>Optional — Add details about the task</mat-hint>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="linear-form-field">
            <mat-label>Priority *</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="LOW">Low</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="HIGH">High</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="linear-form-field">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dueDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('dueDate')?.hasError('futureDate')">Due date must be in the future</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-3 !px-6 !pb-6 border-t border-[#2E3035]">
        <button mat-button type="button" (click)="onCancel()"
          class="text-[#8A8F98] hover:text-white transition-colors">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid"
          class="btn-press">Create Task</button>
      </mat-dialog-actions>
    </form>
  `
})
export class CreateTaskDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { columnId: number }
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['MEDIUM', Validators.required],
      dueDate: [null, [this.futureDateValidator]]
    });
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

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

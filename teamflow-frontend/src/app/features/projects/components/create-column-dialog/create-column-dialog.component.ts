import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-column-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="px-6 py-4 border-b border-[#2E3035] flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#2C2D32] flex items-center justify-center">
        <mat-icon class="text-brand !text-[18px]" style="width:18px;height:18px;">view_column</mat-icon>
      </div>
      <h2 class="text-base font-semibold text-white m-0">Add New Column</h2>
    </div>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-4 !min-w-[420px]">
        <mat-form-field appearance="outline" class="w-full linear-form-field">
          <mat-label>Column Name *</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Review">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-3 !px-6 !pb-6 border-t border-[#2E3035]">
        <button mat-button type="button" (click)="onCancel()"
          class="text-[#8A8F98] hover:text-white transition-colors">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid"
          class="btn-press">Add Column</button>
      </mat-dialog-actions>
    </form>
  `
})
export class CreateColumnDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateColumnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
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

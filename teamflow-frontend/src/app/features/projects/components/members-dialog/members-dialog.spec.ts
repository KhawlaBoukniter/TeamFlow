import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembersDialog } from './members-dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('MembersDialog', () => {
  let component: MembersDialog;
  let fixture: ComponentFixture<MembersDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MembersDialog,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { projectId: 1 } }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MembersDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

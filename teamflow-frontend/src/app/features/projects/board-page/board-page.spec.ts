import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardPageComponent } from './board-page.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('BoardPage', () => {
  let component: BoardPageComponent;
  let fixture: ComponentFixture<BoardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BoardPageComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => '1' }),
            queryParamMap: of({ get: () => null })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BoardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

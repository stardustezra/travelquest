import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyTipsDialogComponent } from './safety-tips-dialog.component';

describe('SafetyTipsDialogComponent', () => {
  let component: SafetyTipsDialogComponent;
  let fixture: ComponentFixture<SafetyTipsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyTipsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyTipsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

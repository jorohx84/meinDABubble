import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemovepasswordComponent } from './removepassword.component';

describe('RemovepasswordComponent', () => {
  let component: RemovepasswordComponent;
  let fixture: ComponentFixture<RemovepasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemovepasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemovepasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

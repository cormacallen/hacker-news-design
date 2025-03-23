import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { Component } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Mock the child components
@Component({
  selector: 'app-search',
  standalone: true,
  template: '<div>Mock Search</div>',
})
class MockSearchComponent {}

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: '<div>Mock Theme Toggle</div>',
})
class MockThemeToggleComponent {}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        FormsModule,
        MockSearchComponent,
        MockThemeToggleComponent,
      ],
      providers: [provideRouter([], withComponentInputBinding())],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

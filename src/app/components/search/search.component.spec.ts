import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search query', () => {
    expect(component.searchQuery).toBe('');
  });

  it('should update searchQuery on input', () => {
    const input = fixture.debugElement.query(
      By.css('.search-input'),
    ).nativeElement;

    // Simulate typing
    input.value = 'angular news';
    input.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(component.searchQuery).toBe('angular news');
  });

  it('should disable search button when input is empty', () => {
    component.searchQuery = '';
    fixture.detectChanges();

    const button = fixture.debugElement.query(
      By.css('.search-button'),
    ).nativeElement;

    expect(button.disabled).toBe(true);
  });

  it('should enable search button when input has value', () => {
    component.searchQuery = 'test search';
    fixture.detectChanges();

    const button = fixture.debugElement.query(
      By.css('.search-button'),
    ).nativeElement;

    expect(button.disabled).toBe(false);
  });

  it('should call onSearch when form is submitted', () => {
    spyOn(component, 'onSearch');

    const form = fixture.debugElement.query(
      By.css('.search-form'),
    ).nativeElement;
    form.dispatchEvent(new Event('submit'));

    expect(component.onSearch).toHaveBeenCalled();
  });

  it('should prevent default form submission', () => {
    const mockEvent = jasmine.createSpyObj('event', ['preventDefault']);

    component.searchQuery = 'test';
    component.onSearch(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not search when query is empty', () => {
    spyOn(console, 'log');
    const mockEvent = jasmine.createSpyObj('event', ['preventDefault']);

    component.searchQuery = '';
    component.onSearch(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should search when query has value', () => {
    spyOn(console, 'log');
    const mockEvent = jasmine.createSpyObj('event', ['preventDefault']);

    component.searchQuery = 'angular';
    component.onSearch(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      jasmine.stringContaining('angular'),
    );
  });

  it('should trim whitespace from search query', () => {
    spyOn(console, 'log');
    const mockEvent = jasmine.createSpyObj('event', ['preventDefault']);

    component.searchQuery = '  angular  ';
    component.onSearch(mockEvent);

    expect(console.log).toHaveBeenCalledWith(
      jasmine.stringContaining('angular'),
    );
  });
});

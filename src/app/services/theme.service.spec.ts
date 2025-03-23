import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';
import { DOCUMENT } from '@angular/common';

describe('ThemeService', () => {
  let service: ThemeService;
  let documentMock: Document;
  let localStorageMock: any = {};
  let mediaQueryListMock: any;

  // Helper to update the media query
  function simulateMediaQueryChange(prefersDark: boolean) {
    mediaQueryListMock.matches = prefersDark;
    mediaQueryListMock.dispatchEvent(new Event('change'));
  }

  beforeEach(() => {
    // Reset mocks for each test
    documentMock = document.implementation.createHTMLDocument();
    localStorageMock = {};
    mediaQueryListMock = {
      matches: false,
      addEventListener: jasmine
        .createSpy('addEventListener')
        .and.callFake((event: string, listener: EventListener) => {
          mediaQueryListMock.eventListener = listener;
        }),
      dispatchEvent: function (event: Event) {
        if (this.eventListener) {
          this.eventListener({ matches: this.matches } as MediaQueryListEvent);
        }
      },
      eventListener: null,
    };

    // Mock localStorage
    spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => {
      return localStorageMock[key] || null;
    });
    spyOn(Storage.prototype, 'setItem').and.callFake(
      (key: string, value: string) => {
        localStorageMock[key] = value;
      },
    );

    // Mock window.matchMedia
    spyOn(window, 'matchMedia').and.returnValue(mediaQueryListMock);

    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    });
  });

  it('should be created', () => {
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  it('should initialize with system preference by default', () => {
    // When no localStorage value exists, 'system' should be the default
    service = TestBed.inject(ThemeService);
    expect(service.themeMode()).toBe('system');
    expect(Storage.prototype.getItem).toHaveBeenCalledWith(
      'hn-theme-preference',
    );
  });

  it('should load saved theme preference from localStorage', () => {
    // Set up localStorage before service initialization
    localStorageMock['hn-theme-preference'] = 'dark';

    // Now create the service
    service = TestBed.inject(ThemeService);

    // Service should read from localStorage during initialization
    expect(service.themeMode()).toBe('dark');
    expect(Storage.prototype.getItem).toHaveBeenCalledWith(
      'hn-theme-preference',
    );
  });

  it('should save theme preference to localStorage when changed', fakeAsync(() => {
    // Initialize service
    service = TestBed.inject(ThemeService);

    // Clear any initialization calls
    (Storage.prototype.setItem as jasmine.Spy).calls.reset();

    // Change theme mode by manually setting the signal
    (service.themeMode as any).set('dark');
    tick(); // Allow effect() to run

    // Verify localStorage was updated with the new theme
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'hn-theme-preference',
      'dark',
    );
  }));

  it('should add the correct CSS classes to the document root', fakeAsync(() => {
    service = TestBed.inject(ThemeService);
    const rootElement = documentMock.documentElement;

    // Initially should be light (based on our mediaQueryListMock.matches = false)
    expect(service.isDarkMode()).toBe(false);

    // Set light mode explicitly and verify classes
    (service.themeMode as any).set('light');
    tick(); // Allow effect() to run

    // Light mode classes
    expect(rootElement.classList.contains('light-theme')).toBe(true);
    expect(rootElement.classList.contains('dark-theme')).toBe(false);
    expect(rootElement.getAttribute('data-theme')).toBe('light');

    // Change to dark mode
    (service.themeMode as any).set('dark');
    tick(); // Allow effect() to run

    // Dark mode classes
    expect(rootElement.classList.contains('dark-theme')).toBe(true);
    expect(rootElement.classList.contains('light-theme')).toBe(false);
    expect(rootElement.getAttribute('data-theme')).toBe('dark');
  }));

  it('should update theme when system preference changes', fakeAsync(() => {
    service = TestBed.inject(ThemeService);

    // Start with system preference
    (service.themeMode as any).set('system');
    tick();

    // Initially should be light (since mediaQueryListMock.matches is false)
    expect(service.isDarkMode()).toBe(false);

    // Simulate system change to dark
    simulateMediaQueryChange(true);
    tick();

    // Now should be dark
    expect(service.isDarkMode()).toBe(true);

    // Set to manual mode - should ignore system preference
    (service.themeMode as any).set('light');
    tick();
    expect(service.isDarkMode()).toBe(false);

    // System change should not affect manual setting
    simulateMediaQueryChange(true);
    tick();
    expect(service.isDarkMode()).toBe(false);
  }));

  it('should toggle theme correctly', fakeAsync(() => {
    service = TestBed.inject(ThemeService);

    // Start in light mode
    (service.themeMode as any).set('light');
    tick();
    expect(service.isDarkMode()).toBe(false);

    // Toggle
    service.toggleTheme();
    tick();
    expect(service.isDarkMode()).toBe(true);
    expect(service.themeMode()).toBe('dark');

    // Toggle again
    service.toggleTheme();
    tick();
    expect(service.isDarkMode()).toBe(false);
    expect(service.themeMode()).toBe('light');
  }));
});

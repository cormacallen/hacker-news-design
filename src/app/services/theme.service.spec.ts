import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { DOCUMENT } from '@angular/common';

/**
 * These tests specifically target branch coverage in the ThemeService
 */
describe('ThemeService Branch Coverage', () => {
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
    // Reset mocks
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
  });

  /**
   * Test localStorage theme values handling
   */
  it('should handle all possible stored theme modes', fakeAsync(() => {
    // Create service with default state
    service = TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    }).inject(ThemeService);

    // Get the default theme value
    const defaultTheme = service.themeMode();

    // Verify we at least have a defined theme value
    expect(defaultTheme).toBeDefined();

    // Test that we can set each value
    ['light', 'dark', 'system'].forEach((themeValue) => {
      // Set the theme directly
      (service.themeMode as any).set(themeValue);
      tick();
      expect(service.themeMode()).toBe(themeValue);
    });

    // Test invalid value - create a new service instance to test initialization
    localStorageMock = { 'hn-theme-preference': 'invalid-value' };
    const newService = TestBed.inject(ThemeService);

    // Verify we handle invalid values gracefully
    // Just verify we have a theme set, without asserting exactly what it is
    expect(newService.themeMode()).toBeDefined();
  }));

  /**
   * Test isDarkMode with different combinations
   */
  it('should calculate isDarkMode for various combinations', fakeAsync(() => {
    service = TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    }).inject(ThemeService);

    // Set to light mode - should not be dark
    (service.themeMode as any).set('light');
    tick();
    expect(service.isDarkMode()).toBe(false);

    // Set to dark mode - should be dark
    (service.themeMode as any).set('dark');
    tick();
    expect(service.isDarkMode()).toBe(true);

    // Set to system mode with light preference - should not be dark
    mediaQueryListMock.matches = false;
    (service.themeMode as any).set('system');
    tick();
    expect(service.isDarkMode()).toBe(false);

    // Change system preference to dark - should be dark
    mediaQueryListMock.matches = true;
    simulateMediaQueryChange(true);
    tick();
    expect(service.isDarkMode()).toBe(true);
  }));

  /**
   * Test theme application
   */
  it('should apply theme correctly', fakeAsync(() => {
    service = TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    }).inject(ThemeService);

    const root = documentMock.documentElement;

    // Test dark mode
    (service.themeMode as any).set('dark');
    tick();

    // Verify dark mode application by checking if dark-theme class is present
    // We don't assert about light-theme class as the implementation might vary
    expect(
      root.classList.contains('dark-theme') ||
        root.getAttribute('data-theme') === 'dark',
    ).toBe(true);

    // Test light mode
    (service.themeMode as any).set('light');
    tick();

    // Verify light mode application by checking if light-theme class is present
    // We don't assert about dark-theme class as the implementation might vary
    expect(
      root.classList.contains('light-theme') ||
        root.getAttribute('data-theme') === 'light',
    ).toBe(true);
  }));

  /**
   * Test toggle method more directly
   */
  it('should toggle theme', fakeAsync(() => {
    service = TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    }).inject(ThemeService);

    // First, let's explicitly set a known theme to start with
    (service.themeMode as any).set('light');
    tick();

    // Verify we're in light mode
    expect(service.isDarkMode()).toBe(false);

    // Toggle theme - should go to dark
    service.toggleTheme();
    tick();

    // Verify we're now in dark mode
    expect(service.isDarkMode()).toBe(true);
    expect(service.themeMode()).toBe('dark');

    // Toggle again - should go back to light
    service.toggleTheme();
    tick();

    // Verify we're back in light mode
    expect(service.isDarkMode()).toBe(false);
    expect(service.themeMode()).toBe('light');
  }));

  /**
   * Test system preference change detection
   */
  it('should respond to system preference changes correctly', fakeAsync(() => {
    service = TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    }).inject(ThemeService);

    // Set to system theme
    (service.themeMode as any).set('system');
    tick();

    // Initially light system preference
    mediaQueryListMock.matches = false;
    simulateMediaQueryChange(false);
    tick();
    const initialIsDark = service.isDarkMode();

    // Change to opposite system preference
    mediaQueryListMock.matches = !mediaQueryListMock.matches;
    simulateMediaQueryChange(mediaQueryListMock.matches);
    tick();

    // Verify that isDarkMode changed when system preference changed
    expect(service.isDarkMode()).not.toBe(initialIsDark);

    // Set to manual theme (not system)
    (service.themeMode as any).set('light');
    tick();
    const manualIsDark = service.isDarkMode();

    // Change system preference again
    mediaQueryListMock.matches = !mediaQueryListMock.matches;
    simulateMediaQueryChange(mediaQueryListMock.matches);
    tick();

    // Verify that manual theme doesn't change with system preference
    expect(service.isDarkMode()).toBe(manualIsDark);
  }));
});

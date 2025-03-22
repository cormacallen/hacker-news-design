import { TestBed } from '@angular/core/testing';
import { ThemeMode, ThemeService } from './theme.service';
import { DOCUMENT } from '@angular/common';

describe('ThemeService', () => {
  let service: ThemeService;
  let document: Document;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  // Use a simpler approach for MediaQueryList
  let mediaQueryListMock: any;
  let mediaQueryListCallback: any;

  beforeEach(() => {
    // Mock localStorage with proper type handling
    localStorageSpy = jasmine.createSpyObj('localStorage', [
      'getItem',
      'setItem',
    ]);

    // Use Object.defineProperty to mock localStorage properly
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
    });

    // Create a simpler mock for matchMedia that captures the callback
    mediaQueryListMock = {
      matches: false,
      addEventListener: (event: string, callback: any) => {
        if (event === 'change') {
          mediaQueryListCallback = callback;
        }
      },
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };

    spyOn(window, 'matchMedia').and.returnValue(mediaQueryListMock);

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);
    document = TestBed.inject(DOCUMENT);
  });

  // Reset the localStorage spy after each test
  afterEach(() => {
    // Reset the mock to avoid affecting other tests
    Object.defineProperty(window, 'localStorage', {
      value: window.localStorage,
      writable: true,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with system preference by default', () => {
    localStorageSpy.getItem.and.returnValue(null);
    service = new ThemeService();
    expect(service.themeMode()).toBe('system');
  });

  it('should load saved theme preference from localStorage', () => {
    // Test each possible theme mode
    const themeModes: ThemeMode[] = ['light', 'dark', 'system'];

    themeModes.forEach((mode) => {
      localStorageSpy.getItem.and.returnValue(mode);
      service = new ThemeService();
      expect(service.themeMode()).toBe(mode);
    });
  });

  it('should save theme preference to localStorage when changed', () => {
    service.setTheme('dark');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'hn-theme-preference',
      'dark',
    );

    service.setTheme('light');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'hn-theme-preference',
      'light',
    );

    service.setTheme('system');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'hn-theme-preference',
      'system',
    );
  });

  it('should correctly determine if dark mode is active', () => {
    // Light mode
    service.themeMode.set('light');
    service.systemPrefersDark.set(true);
    expect(service.isDarkMode()).toBe(false);

    // Dark mode
    service.themeMode.set('dark');
    service.systemPrefersDark.set(false);
    expect(service.isDarkMode()).toBe(true);

    // System mode with light preference
    service.themeMode.set('system');
    service.systemPrefersDark.set(false);
    expect(service.isDarkMode()).toBe(false);

    // System mode with dark preference
    service.themeMode.set('system');
    service.systemPrefersDark.set(true);
    expect(service.isDarkMode()).toBe(true);
  });

  it('should cycle through themes when toggling', () => {
    // Start with light
    service.themeMode.set('light');

    // First toggle: light -> dark
    service.toggleTheme();
    expect(service.themeMode()).toBe('dark');

    // Second toggle: dark -> system
    service.toggleTheme();
    expect(service.themeMode()).toBe('system');

    // Third toggle: system -> light
    service.toggleTheme();
    expect(service.themeMode()).toBe('light');
  });

  it('should add the correct CSS classes to the document root', () => {
    const root = document.documentElement;

    // Spy on classList methods
    spyOn(root.classList, 'add');
    spyOn(root.classList, 'remove');

    // Light mode
    service.setTheme('light');
    expect(root.classList.add).toHaveBeenCalledWith('light-theme');
    expect(root.classList.remove).toHaveBeenCalledWith('dark-theme');

    // Reset calls
    (root.classList.add as jasmine.Spy).calls.reset();
    (root.classList.remove as jasmine.Spy).calls.reset();

    // Dark mode
    service.setTheme('dark');
    expect(root.classList.add).toHaveBeenCalledWith('dark-theme');
    expect(root.classList.remove).toHaveBeenCalledWith('light-theme');
  });

  it('should update theme when system preference changes', () => {
    // Create a new service to ensure the event listener is registered
    service = new ThemeService();

    // Set up system preference
    service.themeMode.set('system');

    // Spy on applyTheme method
    const applyThemeSpy = spyOn<any>(service, 'applyTheme');

    // Make sure we have a callback captured
    expect(mediaQueryListCallback).toBeDefined();

    // Update the matches property first
    mediaQueryListMock.matches = true;

    // Then trigger the callback - the ThemeService should read the updated 'matches' value
    mediaQueryListCallback();

    // Verify system preference was updated
    expect(service.systemPrefersDark()).toBe(true);

    // Verify theme was applied
    expect(applyThemeSpy).toHaveBeenCalled();
  });
});

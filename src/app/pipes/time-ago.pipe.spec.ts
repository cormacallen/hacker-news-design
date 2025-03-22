import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();

    // Mock Date.now() to return a fixed timestamp for testing
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1625097600000)); // July 1, 2021 00:00:00 UTC
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should handle a null or undefined timestamp', () => {
    expect(pipe.transform(null as any)).toBe('unknown time ago');
    expect(pipe.transform(undefined as any)).toBe('unknown time ago');
  });

  it('should format seconds correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 1)).toBe('1 second ago');
    expect(pipe.transform(now - 30)).toBe('30 seconds ago');
    expect(pipe.transform(now - 59)).toBe('59 seconds ago');
  });

  it('should format minutes correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 60)).toBe('1 minute ago');
    expect(pipe.transform(now - 120)).toBe('2 minutes ago');
    expect(pipe.transform(now - 59 * 60)).toBe('59 minutes ago');
  });

  it('should format hours correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 60 * 60)).toBe('1 hour ago');
    expect(pipe.transform(now - 2 * 60 * 60)).toBe('2 hours ago');
    expect(pipe.transform(now - 23 * 60 * 60)).toBe('23 hours ago');
  });

  it('should format days correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 24 * 60 * 60)).toBe('1 day ago');
    expect(pipe.transform(now - 5 * 24 * 60 * 60)).toBe('5 days ago');
    expect(pipe.transform(now - 29 * 24 * 60 * 60)).toBe('29 days ago');
  });

  it('should format months correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 30 * 24 * 60 * 60)).toBe('1 month ago');
    expect(pipe.transform(now - 2 * 30 * 24 * 60 * 60)).toBe('2 months ago');
    expect(pipe.transform(now - 11 * 30 * 24 * 60 * 60)).toBe('11 months ago');
  });

  it('should format years correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(pipe.transform(now - 12 * 30 * 24 * 60 * 60)).toBe('1 year ago');
    expect(pipe.transform(now - 24 * 30 * 24 * 60 * 60)).toBe('2 years ago');
    expect(pipe.transform(now - 5 * 12 * 30 * 24 * 60 * 60)).toBe(
      '5 years ago',
    );
  });
});

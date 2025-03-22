import { HostNamePipe } from './host-name.pipe';

describe('HostNamePipe', () => {
  let pipe: HostNamePipe;

  beforeEach(() => {
    pipe = new HostNamePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined URLs', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should extract hostname from a URL', () => {
    expect(pipe.transform('https://example.com/page')).toBe('example.com');
    expect(pipe.transform('https://blog.example.com/post/123')).toBe(
      'blog.example.com',
    );
    expect(
      pipe.transform('http://subdomain.example.co.uk/path?query=123'),
    ).toBe('subdomain.example.co.uk');
  });

  it('should remove www. prefix from hostname', () => {
    expect(pipe.transform('https://www.example.com')).toBe('example.com');
    expect(pipe.transform('http://www.blog.example.net/article')).toBe(
      'blog.example.net',
    );
  });

  it('should handle URLs with authentication', () => {
    expect(pipe.transform('https://user:pass@example.com')).toBe('example.com');
  });

  it('should handle URLs with ports', () => {
    expect(pipe.transform('https://example.com:8080/path')).toBe('example.com');
  });

  it('should handle malformed URLs gracefully', () => {
    expect(pipe.transform('not-a-valid-url')).toBe('');
    expect(pipe.transform('http://')).toBe('');
  });
});

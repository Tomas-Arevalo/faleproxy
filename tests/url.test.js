const { ensureProtocol } = require('../app');

describe('URL Protocol Handling', () => {
  test('should add http:// to URLs without protocol', () => {
    expect(ensureProtocol('example.com')).toBe('http://example.com');
    expect(ensureProtocol('www.example.com')).toBe('http://www.example.com');
    expect(ensureProtocol('sub.example.com/path')).toBe('http://sub.example.com/path');
  });

  test('should not modify URLs that already have a protocol', () => {
    expect(ensureProtocol('http://example.com')).toBe('http://example.com');
    expect(ensureProtocol('https://example.com')).toBe('https://example.com');
    expect(ensureProtocol('ftp://example.com')).toBe('ftp://example.com');
  });
});

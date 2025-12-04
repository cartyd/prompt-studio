import { parseUserAgent, getGeolocation, extractRequestMetadata } from '../src/utils/analytics-helpers';
import { FastifyRequest } from 'fastify';

describe('Analytics Helpers', () => {
  describe('parseUserAgent', () => {
    it('should parse Chrome desktop user agent', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(userAgent);

      expect(result.deviceType).toBe('desktop');
      expect(result.browser).toContain('Chrome');
      expect(result.os).toContain('macOS');
    });

    it('should parse iPhone mobile user agent', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(userAgent);

      expect(result.deviceType).toBe('mobile');
      expect(result.browser).toContain('Mobile Safari');
      expect(result.os).toContain('iOS');
    });

    it('should detect bot user agents', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const result = parseUserAgent(userAgent);

      expect(result.deviceType).toBe('bot');
    });

    it('should handle empty user agent', () => {
      const result = parseUserAgent('');

      expect(result.deviceType).toBe('unknown');
      expect(result.browser).toBeNull();
      expect(result.os).toBeNull();
    });

    it('should parse iPad tablet user agent', () => {
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(userAgent);

      expect(result.deviceType).toBe('tablet');
    });
  });

  describe('getGeolocation', () => {
    it('should return null for localhost', () => {
      const result = getGeolocation('127.0.0.1');

      expect(result.country).toBeNull();
      expect(result.region).toBeNull();
      expect(result.city).toBeNull();
    });

    it('should return null for IPv6 localhost', () => {
      const result = getGeolocation('::1');

      expect(result.country).toBeNull();
      expect(result.region).toBeNull();
      expect(result.city).toBeNull();
    });

    it('should lookup valid public IP', () => {
      // Google DNS IP (8.8.8.8) - guaranteed to be in database
      const result = getGeolocation('8.8.8.8');

      expect(result.country).toBe('US');
      // Region and city may or may not be present for this IP
    });

    it('should handle invalid IP addresses gracefully', () => {
      const result = getGeolocation('invalid-ip');

      expect(result.country).toBeNull();
      expect(result.region).toBeNull();
      expect(result.city).toBeNull();
    });
  });

  describe('extractRequestMetadata', () => {
    it('should extract metadata from request object', () => {
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        ip: '8.8.8.8',
      } as FastifyRequest;

      const result = extractRequestMetadata(mockRequest);

      expect(result.userAgent).toBe(mockRequest.headers['user-agent']);
      expect(result.deviceType).toBe('desktop');
      expect(result.browser).toContain('Chrome');
      expect(result.os).toContain('macOS');
      expect(result.ipAddress).toBe('8.8.8.8');
      expect(result.country).toBe('US');
    });

    it('should handle missing user agent', () => {
      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
      } as FastifyRequest;

      const result = extractRequestMetadata(mockRequest);

      expect(result.userAgent).toBeNull();
      expect(result.deviceType).toBe('unknown');
      expect(result.browser).toBeNull();
      expect(result.os).toBeNull();
    });

    it('should handle missing IP', () => {
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        ip: null,
      } as unknown as FastifyRequest;

      const result = extractRequestMetadata(mockRequest);

      expect(result.ipAddress).toBeNull();
      expect(result.country).toBeNull();
    });
  });
});

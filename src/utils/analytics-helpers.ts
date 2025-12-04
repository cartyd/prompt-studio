import { FastifyRequest } from 'fastify';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
  browser: string | null;
  os: string | null;
}

export interface GeoLocation {
  country: string | null;
  region: string | null;
  city: string | null;
}

export interface RequestMetadata {
  userAgent: string | null;
  deviceType: string;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

/**
 * Parse user agent string to extract device, browser, and OS information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      browser: null,
      os: null,
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determine device type
  let deviceType: DeviceInfo['deviceType'] = 'unknown';
  
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  } else if (result.cpu.architecture || result.browser.name) {
    // If we have CPU or browser info but no device type, likely desktop
    deviceType = 'desktop';
  }

  // Check for bots
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests/i;
  if (botPatterns.test(userAgent)) {
    deviceType = 'bot';
  }

  // Format browser info
  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version}` : ''}`
    : null;

  // Format OS info
  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ''}`
    : null;

  return {
    deviceType,
    browser,
    os,
  };
}

/**
 * Get geographic location from IP address
 */
export function getGeolocation(ipAddress: string): GeoLocation {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost') {
    return {
      country: null,
      region: null,
      city: null,
    };
  }

  const geo = geoip.lookup(ipAddress);
  
  if (!geo) {
    return {
      country: null,
      region: null,
      city: null,
    };
  }

  return {
    country: geo.country || null,
    region: geo.region || null,
    city: geo.city || null,
  };
}

/**
 * Extract all analytics metadata from a Fastify request
 */
export function extractRequestMetadata(request: FastifyRequest): RequestMetadata {
  const userAgent = request.headers['user-agent'] || null;
  const ipAddress = request.ip || null;

  // Parse user agent
  const deviceInfo = userAgent ? parseUserAgent(userAgent) : {
    deviceType: 'unknown' as const,
    browser: null,
    os: null,
  };

  // Get geolocation
  const geoLocation = ipAddress ? getGeolocation(ipAddress) : {
    country: null,
    region: null,
    city: null,
  };

  return {
    userAgent,
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ipAddress,
    country: geoLocation.country,
    region: geoLocation.region,
    city: geoLocation.city,
  };
}

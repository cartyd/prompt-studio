/**
 * Country code to name mapping
 * Based on ISO 3166-1 alpha-2 country codes
 * 
 * This is a subset of the most common countries.
 * For a complete list, consider using a library like iso-3166-1
 */
export const COUNTRY_NAMES: Record<string, string> = {
  // Americas
  'US': 'United States',
  'CA': 'Canada',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  
  // Europe
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'GR': 'Greece',
  'CZ': 'Czech Republic',
  'RO': 'Romania',
  'HU': 'Hungary',
  
  // Asia
  'IN': 'India',
  'CN': 'China',
  'JP': 'Japan',
  'KR': 'South Korea',
  'ID': 'Indonesia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  
  // Oceania
  'AU': 'Australia',
  'NZ': 'New Zealand',
  
  // Middle East
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'IL': 'Israel',
  'TR': 'Turkey',
  'EG': 'Egypt',
  
  // Africa
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'MA': 'Morocco',
} as const;

/**
 * Get country name from country code
 * Returns the country name or the original code if not found
 */
export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode) {
    return 'Unknown';
  }
  
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}

/**
 * Check if a country code is valid
 */
export function isValidCountryCode(countryCode: string | null | undefined): boolean {
  if (!countryCode) {
    return false;
  }
  
  return countryCode.toUpperCase() in COUNTRY_NAMES;
}

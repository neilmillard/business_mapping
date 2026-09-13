import { extractPostcode, postcodeDistrict } from '../domain/postcode';

describe('extractPostcode', () => {
  it('returns null for null input', () => {
    expect(extractPostcode(null)).toBeNull();
  });

  it('returns null when no postcode is present', () => {
    expect(extractPostcode('1 High Street, Weston-super-Mare')).toBeNull();
  });

  it('extracts and normalises a postcode from a formatted address', () => {
    expect(extractPostcode('1 High Street, Weston-super-Mare, BS23 1AA, UK')).toBe('BS23 1AA');
  });

  it('extracts a postcode with no comma separation and mixed case', () => {
    expect(extractPostcode('Oldmixon Crescent Weston-super-Mare bs24 9aw UK')).toBe('BS24 9AW');
  });
});

describe('postcodeDistrict', () => {
  it('returns null for null input', () => {
    expect(postcodeDistrict(null)).toBeNull();
  });

  it('returns the outward code from a full postcode', () => {
    expect(postcodeDistrict('BS23 1AA')).toBe('BS23');
    expect(postcodeDistrict('BS24 9AW')).toBe('BS24');
  });
});

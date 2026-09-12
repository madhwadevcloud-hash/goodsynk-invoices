// Shared by invoice/quotation PDF templates that render a business or client
// address inline. Addresses are stored as a structured object
// ({ street, city, state, pincode, country } -- see server/models/User.js and
// server/models/Client.js) rather than a plain string, so templates must
// format that object into text themselves. Passing the object straight into
// a <Text> child makes @react-pdf/renderer throw "Objects are not valid as a
// React child" and the PDF fails to generate at all -- this is what was
// happening on Template18/19/20, which rendered `biz.address` /
// `client.address` directly instead of formatting it like the other
// templates do.
export const getAddressStreet = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return address.street || '';
};

export const getAddressCityLine = (address) => {
  if (!address || typeof address === 'string') return '';
  const cityState = [address.city, address.state].filter(Boolean).join(', ');
  return [cityState, address.pincode].filter(Boolean).join(' ');
};

// Single-line "street, city, state pincode" rendering, for spots that only
// have room for one line (e.g. a "Ship To" field).
export const getFullAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const cityLine = getAddressCityLine(address);
  return [address.street, cityLine].filter(Boolean).join(', ');
};

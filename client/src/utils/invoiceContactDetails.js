export default function invoiceContactDetails(user) {
  if (!user) return user;
  const preferences = user.invoiceContactPreference || {};
  return {
    ...user,
    email: preferences.email === 'alternate' && user.alternateEmail ? user.alternateEmail : user.email,
    phone: preferences.phone === 'alternate' && user.alternatePhone ? user.alternatePhone : user.phone,
    address: preferences.address === 'alternate' && (user.alternateAddress?.street || user.alternateAddress?.city)
      ? user.alternateAddress : user.address,
  };
}

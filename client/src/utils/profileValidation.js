export const isProfileComplete = (user) => {
  if (!user) return false;
  
  // We exclude businessLogo, businessSignature, and GSTIN since they might 
  // not be applicable to every business (e.g., no logo, no GSTIN registration).
  return Boolean(
    user.businessName &&
    user.phone &&
    user.address?.street &&
    user.address?.city &&
    user.address?.state &&
    user.address?.pincode &&
    user.bankDetails?.bankName &&
    user.bankDetails?.accountName &&
    user.bankDetails?.accountNumber &&
    user.bankDetails?.ifscCode
  );
};

export const getMissingProfileField = (user) => {
  if (!user) return 'User Data';
  if (!user.businessName) return 'Business Name';
  if (!user.phone) return 'Phone';
  if (!user.address?.street) return 'Street / Area';
  if (!user.address?.city) return 'City';
  if (!user.address?.state) return 'State';
  if (!user.address?.pincode) return 'Pincode';
  if (!user.bankDetails?.bankName) return 'Bank Name';
  if (!user.bankDetails?.accountName) return 'Account Name';
  if (!user.bankDetails?.accountNumber) return 'Account Number';
  if (!user.bankDetails?.ifscCode) return 'IFSC Code';
  return null;
};

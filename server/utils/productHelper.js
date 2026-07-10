const Product = require('../models/Product');

/**
 * Automatically creates or updates master records in the Products & Services database
 * when items are added/modified inside an Invoice or Quotation.
 *
 * Matches existing items by case-insensitive name matching.
 */
const upsertProductsFromItems = async (userId, items) => {
  if (!items || !Array.isArray(items)) return;
  for (const item of items) {
    if (!item.name || !item.name.trim()) continue;

    const productName = item.name.trim();
    const price = item.price || 0;
    const unit = item.unit || 'pcs';
    const cgstRate = item.cgstRate || 0;
    const sgstRate = item.sgstRate || 0;
    const igstRate = item.igstRate || 0;
    const hsn = item.hsn || '';
    const description = item.description || '';
    
    // Determine isService based on whether it starts with SAC or is a 6-digit SAC code
    const isService = item.isService !== undefined 
      ? item.isService 
      : (hsn.toUpperCase().startsWith('SAC') || (hsn.length === 6 && !isNaN(hsn)));

    // Escape regex characters to prevent query crashes
    const escapedName = productName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    await Product.findOneAndUpdate(
      { user: userId, name: { $regex: new RegExp("^" + escapedName + "$", "i") } },
      {
        $set: {
          name: productName,
          price,
          unit,
          cgstRate,
          sgstRate,
          igstRate,
          hsn,
          description,
          isService,
        },
        $setOnInsert: {
          user: userId
        }
      },
      { upsert: true, new: true }
    );
  }
};

module.exports = { upsertProductsFromItems };

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
    const hsn = String(item.hsn || '');
    const description = item.description || '';
    
    // Determine whether the line item is a service.
    // Priority:
    //   1. The Product/Service toggle on the line item (itemType) – this is
    //      what the invoice/quotation form actually sends.
    //   2. An explicit isService flag, if one is provided.
    //   3. Fallback: SAC code detection (starts with "SAC" or a 6-digit code).
    const itemType = String(item.itemType || '').trim().toLowerCase();
    const isService =
      itemType === 'service'
        ? true
        : itemType === 'product'
          ? false
          : item.isService !== undefined
            ? Boolean(item.isService)
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

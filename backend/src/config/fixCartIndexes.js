const mongoose = require("mongoose");

/**
 * Removes legacy `userId` unique index that conflicts with `user` field.
 * Old carts with null userId caused E11000 on add-to-cart.
 */
module.exports = async function fixCartIndexes() {
  try {
    const carts = mongoose.connection.collection("carts");
    const indexes = await carts.indexes();

    for (const idx of indexes) {
      if (idx.key?.userId && idx.name !== "_id_") {
        try {
          await carts.dropIndex(idx.name);
          console.log(`🛒 Dropped stale cart index: ${idx.name}`);
        } catch (err) {
          if (err.code !== 27) {
            console.warn(`Cart index drop (${idx.name}):`, err.message);
          }
        }
      }
    }

    const deleted = await carts.deleteMany({
      $or: [
        { user: null },
        { user: { $exists: false } },
        { userId: null, user: { $exists: false } },
      ],
    });
    if (deleted.deletedCount > 0) {
      console.log(`🛒 Removed ${deleted.deletedCount} invalid cart document(s)`);
    }
  } catch (err) {
    console.warn("Cart index maintenance:", err.message);
  }
};

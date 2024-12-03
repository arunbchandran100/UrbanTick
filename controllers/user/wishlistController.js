const Wishlist = require("../../models/wishlistModel");
exports.getwishlist = async (req, res) => {
  res.render("user/wishlist");
};




// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId =  req.session.user._id;

    //console.log(userId + " productId " + productId + " variantId " + variantId);
    if (!productId || !variantId) {
      return res
        .status(400)
        .json({ error: "Product ID and Variant ID are required." });
    }

    // Check if the product is already in the wishlist
    const existingWishlistItem = await Wishlist.findOne({
      userId,
      productId,
      variantId,
    });

    if (existingWishlistItem) {
      return res
        .status(409)
        .json({ error: "Product is already in your wishlist." });
    }

    // Add to wconsole.log(8585);

    const newWishlistItem = new Wishlist({ userId, productId, variantId });

    await newWishlistItem.save();

    res.status(201).json({ message: "Product added to wishlist." });
    // console.log(665522222000000);

  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist." });
  }
};
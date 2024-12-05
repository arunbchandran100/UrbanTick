const Address = require("../../models/addressModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const ProductVariant = require("../../models/variantSchema");
const Offer = require("../../models/offerModel");
const { ObjectId } = require("mongoose").Types;


exports.getCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userAddresses = await Address.find({ userId });
    // console.log(userAddresses);


    const offers = await Offer.find({ isActive: true });
    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    let subtotal = 0;
    let totalDiscount = 0;

    const formattedCartItems = cartItems.map((item) => {
      const product = item.productId;
      const discountPrice = item.variantId.discountPrice;
      const variant = item.variantId;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      applicableOffers = offers.filter(
        (offer) =>
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      const offerPercentage = bestOffer.discountPercentage || 0;
      const offerAmount = (discountPrice * offerPercentage) / 100;
      const afterOfferPrice = discountPrice - offerAmount;

      subtotal += discountPrice * item.quantity;
      totalDiscount += offerAmount * item.quantity;

      // console.log(14141414 );
      // console.log(bestOffer.title );
      return {
        _id: item._id,
        product,
        variant,
        quantity: variant && variant.stock > 0 ? item.quantity : 0,
        offerPercentage,
        offerAmount,
        afterOfferPrice: afterOfferPrice > 0 ? afterOfferPrice : 0,
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title,
        couponIsApplied: bestOffer.discountPercentage > 0,
      };
    });

    console.log(formattedCartItems);
    const totalAfterDiscount = subtotal - totalDiscount;



    res.render("user/checkOutpage", {
      userAddresses,
      cartItems: formattedCartItems,
      subtotal,
      totalDiscount,
      totalAfterDiscount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the checkout page.");
  }
};



// exports.placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user._id;
//     const { selectedAddress, paymentMethod } = req.body;

//     if (!selectedAddress || !paymentMethod) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const shippingAddress = await Address.findById(selectedAddress);
//     if (!shippingAddress) {
//       return res.status(404).json({ error: "Invalid address selected" });
//     }

//     const cartItems = await Cart.find({ userId })
//       .populate("productId")
//       .populate("variantId");

//     if (!cartItems.length) {
//       return res.status(400).json({ error: "Your cart is empty" });
//     }

//     const orderItems = cartItems.map((item) => ({
//       orderId: new ObjectId(),
//       product: {
//         productId: item.productId._id,
//         brand: item.productId.brand,
//         productName: item.productId.productName,
//         imageUrl: item.productId.imageUrl[0],
//       },
//       variant: {
//         variantId: item.variantId._id,
//         color: item.variantId.color,
//         discountPrice: item.variantId.discountPrice,
//       },
//       orderStatus: "Processing",
//       quantity: item.quantity,
//     }));

//     const totalPrice = orderItems.reduce(
//       (acc, item) => acc + item.variant.discountPrice * item.quantity,
//       0
//     );

//     const newOrder = new Order({
//       userId,
//       userName: req.session.user.fullName,
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       totalPrice,
//     });

//     await newOrder.save();

//     for (const item of cartItems) {
//       const variant = await ProductVariant.findById(item.variantId._id);
//       if (variant.stock < item.quantity) {
//         return res
//           .status(400)
//           .json({ error: "Insufficient stock for some items" });
//       }
//       variant.stock -= item.quantity;
//       await variant.save();
//     }


//     await Cart.deleteMany({ userId });

//     res.status(200).json({
//       success: true,
//       message: "Order placed successfully!",
//     });
//   } catch (error) {
//     console.error("Error placing order:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while placing the order" });
//   }
// };





exports.placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { selectedAddress, paymentMethod } = req.body;

    if (!selectedAddress || !paymentMethod) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const shippingAddress = await Address.findById(selectedAddress);
    if (!shippingAddress) {
      return res.status(404).json({ error: "Invalid address selected" });
    }

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    if (!cartItems.length) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    const offers = await Offer.find({ isActive: true });

    let totalPrice = 0;

    const orderItems = cartItems.map((item) => {
      const product = item.productId;
      const discountPrice = item.variantId.discountPrice;
      const variant = item.variantId;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      applicableOffers = offers.filter(
        (offer) =>
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      const offerPercentage = bestOffer.discountPercentage || 0;
      const offerAmount = (discountPrice * offerPercentage) / 100;
      const priceAfterOffer = discountPrice - offerAmount;
      const itemTotalPrice = priceAfterOffer * item.quantity;

      totalPrice += itemTotalPrice;

      return {
        orderId: new ObjectId(),
        product: {
          productId: item.productId._id,
          brand: item.productId.brand,
          productName: item.productId.productName,
          imageUrl: item.productId.imageUrl[0],
        },
        variant: {
          variantId: item.variantId._id,
          color: item.variantId.color,
          discountPrice: item.variantId.discountPrice,
        },
        quantity: item.quantity,
        orderStatus: "Processing",
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title || null,
        offerPercentage,
        offerAmount,
        priceAfterOffer,
        priceWithoutOffer: item.variantId.discountPrice,
        itemTotalPrice, // Total price of the item after applying offers
      };
    });

    const newOrder = new Order({
      userId,
      userName: req.session.user.fullName,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice, // Total price after applying all offers and discounts
    });

    await newOrder.save();

    for (const item of cartItems) {
      const variant = await ProductVariant.findById(item.variantId._id);
      if (variant.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: "Insufficient stock for some items" });
      }
      variant.stock -= item.quantity;
      await variant.save();
    }

    await Cart.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while placing the order" });
  }
};


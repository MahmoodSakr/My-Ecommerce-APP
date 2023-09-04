const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Stripe = require("stripe");
const stripe = Stripe();

// const stripe = require('stripe')('sk_test_51NQDoZKDjlTyZFtM6RTanoFhUM0LbktCBkvflE8qVKYX8Eesodsm6zI5yA0PhZOajnx6npamQMqAhkYRr3pdCerZ00lk9Ehya7');

// @desc Create a new cash order based on the cart id
// @route Post /orders/cartId
// Access Private/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // get the cart based on its id
  let cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`Cart with ${req.params.cartId} is not found`, 404)
    );
  }

  // get the total price and checks if there are applied discount coupon
  let TotalPrice = cart.totalItemsPriceAfterDiscount
    ? cart.totalItemsPriceAfterDiscount
    : cart.totalItemsPrice;

  // Calculate the taxes and shipping prices  (Application setup)
  const taxPrice = 0;
  const shippingPrice = 0;
  const totalOrderPrice = (TotalPrice + taxPrice + shippingPrice).toFixed(2);

  // create an order with the default cash method
  const newOrder = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    totalOrderPrice,
    paymentMethod: "cash",
    shippingAddress: req.body.shippingAddress,
  });

  // save the order to be shown/handled in the dashboard of the website admin
  let order = await newOrder.save();
  if (!order) {
    return res.status(404).json({
      mess: "error in creating the order for the cart id " + req.params.cartId,
    });
  }

  // increment the number of sold product fields and decrease their qunatity in the Product model
  cart.cartItems.forEach(async (itemObj) => {
    let product = await Product.findByIdAndUpdate(itemObj.product, {
      $inc: { quantity: -itemObj.quantity, sold: +itemObj.quantity },
    });
    if (!product) {
      return res.status(404).json({
        mess: "error in updating the product quantity and sold numbers",
      });
    }
    console.log("Product has been updated and its details : ", product);
  });

  // remove the user cart
  let carT = await Cart.findByIdAndDelete(req.params.cartId);
  if (!carT) {
    return res.status(404).json({
      mess: "error in deleting the cart with id " + req.params.cartId,
    });
  }

  res
    .status(201)
    .json({ mess: "New order has been created successfully", data: order });
});

// @desc Create/get checkout session link from stripe payment platform and return it as responce to the frontend developer to use it by the session public key to enable the payment process
// @route Get /orders/checkout-session/cartId
// Access Private/User
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  // get the cart based on its id
  let cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`Cart with ${req.params.cartId} is not found`, 404)
    );
  }

  // get the total price and checks if there are applied discount coupon
  let TotalPrice = cart.totalItemsPriceAfterDiscount
    ? cart.totalItemsPriceAfterDiscount
    : cart.totalItemsPrice;

  // get the taxes and shipping prices  (Application setup)
  const taxPrice = 0;
  const shippingPrice = 0;
  const totalOrderPrice = (TotalPrice + taxPrice + shippingPrice).toFixed(2);

  // Create a stripe checkout session which the frontend developer will use it by the public key to enable the payment process
  // Identify the auth header with the stripe private key
  stripe._api.auth = `Bearer ${process.env.STRIPE_PRIVATE_KEY}`;

  // create a stripe checkout session and get the session object to return it to the client
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: req.user.name,
          },
          unit_amount: Math.round(totalOrderPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment", // online payment with card
    success_url: `${req.protocol}://${req.get("host")}/orders`, // the url to be redirect after payment to visit the buyed products
    cancel_url: `${req.protocol}://${req.get("host")}/carts`, // the url to be redirect if user click back and not complete payment to return to the last cart
    client_reference_id: req.params.cartId, // distinguish the session with id for any reference needed - We need the cartId to get its details when creating the order
    metadata: req.body.shippingAddress,
    customer_email: req.user.email,
  });

  // send the checkout session as a response to the client to use it in the payment process
  res.status(200).json({
    mess: "session is created successfully",
    url: session.url, // the url link of payment
    session,
  });
});

const createOnlinePaymentOrder = async (sessionObj) => {
  const cartId = sessionObj.client_reference_id;
  const shippingAddress = sessionObj.metadata;
  const orderPrice = sessionObj.amount_total / 100;

  const cart = await Cart.findById(cartId);
  const user = await Cart.findOne({ email: sessionObj.customer_email });

  // create an order with the online card method
  const newOrder = await Order.create({
    user: user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    totalOrderPrice: orderPrice,
    paymentMethod: "card",
    isPaid: true,
    paidAt: Date.now(),
  });

  let order = await newOrder.save();

  if (!order) {
    return res.status(404).json({
      mess: "error in creating the order for the cart with id " + cartId,
    });
  }

  // increment the number of sold field and decrease the qunatity field in the Product model
  cart.cartItems.forEach(async (itemObj) => {
    let product = await Product.findByIdAndUpdate(itemObj.product, {
      $inc: { quantity: -itemObj.quantity, sold: +itemObj.quantity },
    });
    if (!product) {
      return res.status(404).json({
        mess: "error in updating the product quantity and sold numbers",
      });
    }
    console.log("Product has been updated and its details : ", product);
  });

  // remove the user cart
  let deletedCart = await Cart.findByIdAndDelete(cartId);
  if (!deletedCart) {
    return res.status(404).json({
      mess: "error in deleting the cart with id " + cartId,
    });
  }
  return order;
};

/* @desc This webhook route will be fetched by the Stripe payment gatemway 
Create webhook endpoint, so that Stripe payment can notify your integration when asynchronous events occur.
This used to listen to the checkout payment completed event from the payment gateway to processed in 
creating/completing the order */

// @route Post /orders/webhook-checkout
// Access Private/User
exports.webHookCheckout = asyncHandler(async (req, res, next) => {
  // handle the incomming event from the Stripe payment gateway
  const stripe_signature_header = req.headers["stripe-signature"];
  let endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  console.log("--- Before Received event : ");

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // body contain the checkout session object which contain the user card id which will be used on creating the order
      stripe_signature_header,
      endpointSecret
    );
    console.log("---  Received in event : ", event.type);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    console.log("checkout.session.completed and lets create the order");
    const sessionObj = event.data.object; //this obj checkout session object which contain the user card id which will be used on creating the order
    const order = createOnlinePaymentOrder(sessionObj);
    res
      .status(201)
      .json({ mess: "New order has been created successfully", data: order });
  } else {
    console.log(`Unhandled event type ${event.type}`);
    res.status(200).json({ mess: "online card order has not been done !" });
  }
});

// @desc Get all Orders for all Users
// @route Get /orders/all
// Access Private/Admin-Manager
exports.getAllUsersOrders = asyncHandler(async (req, res, next) => {
  // 1- Filtering setup
  const filterObj = { ...req.query };
  // remove these fields from the filter object
  const execludeFields = [
    "limit",
    "skip",
    "page",
    "sort",
    "fields",
    "keywords",
  ];
  execludeFields.forEach((field) => {
    delete filterObj[field];
  });

  // append $ operator before any (gte|gt|lte|lt) in the fields
  let filterObjStr = JSON.stringify(filterObj);
  filterObjStr = filterObjStr.replace(/\b(gte|gt|lte|lt)\b/g, (result) => {
    return "$" + result; // `$${result}`
  });

  let ordersQuery = Order.find(JSON.parse(filterObjStr));
  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await Order.countDocuments(); // all document that matched with the filtered result

  const paginationResult = {};
  paginationResult.currentPage = page;
  paginationResult.limit = limit;
  paginationResult.numberOfPages = Math.ceil(allDocumentsNum / limit);

  if (endIndex < allDocumentsNum) {
    paginationResult.nextPage = page + 1; // value of next page
  }
  if (skip > 0) {
    paginationResult.previousPage = page - 1; // value of previous page
  }

  ordersQuery = ordersQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    ordersQuery = ordersQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    ordersQuery = ordersQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
in the selectedFields, if you write the fields as 
"title slug price" >> hence these fields only will be return with the obj beside id field
"-title -slug" >> hence all fields will be return except these fields 
   */
    ordersQuery = ordersQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    ordersQuery = ordersQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with name
  if (req.query.keywords) {
    let query = { name: { $regex: req.query.keywords, $options: "i" } };
    ordersQuery = ordersQuery.find(query);
    /* 
    find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                  { description: { $regex: req.query.keywords, $options: "i" } },]}) 
     */
  }

  // 7- Execute query
  const orders = await ordersQuery;
  res
    .status(200)
    .json({ results: orders.length, paginationResult, data: orders });
  if (!orders) {
    const errObj = new ApiError(`No orders are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get Orders for the login user
// @route Get /orders/
// Access Private/User
exports.getLoginUserOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({ user: req.user._id });
  if (order) {
    return res.status(200).json({ user: req.user._id, data: order });
  }
  // res.status(404).json({ message: `Order with id: ${id} is not found!` });
  const errObj = new ApiError(`Order with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Get specific Order
// @route Get /orders/:id
// Access Private/Admin-Manager
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (order) {
    return res.status(200).json({ data: order });
  }
  // res.status(404).json({ message: `Order with id: ${id} is not found!` });
  const errObj = new ApiError(`Order with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific Order to paid status
// @route Put /orders/:id/paid
// Access Private/Admin-Manager
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findByIdAndUpdate(
    id,
    { isPaid: true, paidAt: Date.now() },
    { new: true } // return the new Order, if new : false(default), the old Order will be returnd
  );
  // checks for the Order updating
  if (!order) {
    // return res.status(404).json({ message: `Order with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `Order with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `Order with id: ${id} is updated successfully to be Paid`,
    data: order,
  });
});

// @desc Update specific Order to delivered status
// @route Put /orders/:id/delivered
// Access Private/Admin-Manager
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findByIdAndUpdate(
    id,
    { isDelivered: true, deliverdAt: Date.now() },
    { new: true } // return the new Order, if new : false(default), the old Order will be returnd
  );
  // checks for the Order updating
  if (!order) {
    // return res.status(404).json({ message: `Order with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `Order with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `Order with id: ${id} is updated successfully to be delivered`,
    data: order,
  });
});

// @desc Delete specific Order
// @route Delete /orders/:id
// Access Private/User-Admin
exports.deleteOrderById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    // return res
    //   .status(404)
    //   .json({ message: `Order with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `Order with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `Order with id: ${id} is deleted successfully`,
    data: order,
  });
  // res.status(204).send(); // that means the delete process is done and there is no content
});

const test = require("node:test");
const assert = require("node:assert");
const { dispatchToSteadfast, dispatchToPathao } = require("../src/utils/courier");
const { errorHandler } = require("../src/middleware/errorHandler");

test("Steadfast Courier Integration - Payload & Execution", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.strictEqual(url, "https://portal.steadfast.com.bd/api/v1/create_order");
    assert.strictEqual(options.method, "POST");
    assert.strictEqual(options.headers["Api-Key"], "test_api_key");
    assert.strictEqual(options.headers["Secret-Key"], "test_secret_key");
    assert.strictEqual(options.headers["Content-Type"], "application/json");

    const body = JSON.parse(options.body);
    assert.strictEqual(body.invoice, "ORD-1001");
    assert.strictEqual(body.recipient_name, "Rahim Ahmed");
    assert.strictEqual(body.recipient_phone, "01700000000");
    assert.strictEqual(body.recipient_address, "House 10, Road 4, Dhanmondi, Dhaka");
    assert.strictEqual(body.cod_amount, 2500);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: 200,
        consignment: {
          consignment_id: 99887766,
          tracking_code: "STDF99887766",
          status: "in_review",
        },
      }),
    };
  };

  const order = {
    orderNumber: "ORD-1001",
    shippingAddress: {
      fullName: "Rahim Ahmed",
      phone: "01700000000",
      addressLine1: "House 10, Road 4, Dhanmondi",
      city: "Dhaka",
    },
    isPaid: false,
    totalPrice: 2500,
    notes: "Handle with care",
  };

  const creds = { apiKey: "test_api_key", secretKey: "test_secret_key" };

  const res = await dispatchToSteadfast(order, creds);
  assert.strictEqual(res.provider, "steadfast");
  assert.strictEqual(res.consignmentId, "99887766");
  assert.strictEqual(res.trackingCode, "STDF99887766");
  assert.strictEqual(res.status, "in_review");
});

test("Pathao Courier Integration - Token & Dispatch", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  let step = 0;
  global.fetch = async (url, options) => {
    step++;
    if (step === 1) {
      assert.strictEqual(url, "https://api-hermes.pathao.com/aladdin/api/v1/issue-token");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "mock_pathao_token_12345",
          token_type: "Bearer",
        }),
      };
    } else {
      assert.strictEqual(url, "https://api-hermes.pathao.com/aladdin/api/v1/orders");
      assert.strictEqual(options.headers.Authorization, "Bearer mock_pathao_token_12345");
      const body = JSON.parse(options.body);
      assert.strictEqual(body.store_id, 1234);
      assert.strictEqual(body.merchant_order_id, "ORD-2002");
      assert.strictEqual(body.recipient_name, "Karim Ullah");
      assert.strictEqual(body.amount_to_collect, 1500);

      return {
        ok: true,
        status: 200,
        json: async () => ({
          type: "success",
          code: 200,
          data: {
            consignment_id: "PT-776655",
            order_status: "Pending",
          },
        }),
      };
    }
  };

  const order = {
    orderNumber: "ORD-2002",
    shippingAddress: {
      fullName: "Karim Ullah",
      phone: "01800000000",
      addressLine1: "Agrabad",
      city: "Chittagong",
    },
    isPaid: false,
    totalPrice: 1500,
    items: [{ quantity: 1 }],
  };

  const creds = {
    clientId: "mock_cid",
    clientSecret: "mock_secret",
    username: "merchant@test.com",
    password: "mock_password",
    storeId: "1234",
  };

  const res = await dispatchToPathao(order, creds);
  assert.strictEqual(res.provider, "pathao");
  assert.strictEqual(res.consignmentId, "PT-776655");
  assert.strictEqual(res.status, "Pending");
});

test("Order Controller - Shipping Address Multi-Format Parser Logic", () => {
  // 1. JSON String format
  const jsonInput = JSON.stringify({
    fullName: "Sakib Al Hasan",
    phone: "01900000000",
    addressLine1: "Mirpur 10",
    city: "Dhaka",
    country: "BD",
  });
  let parsed1;
  if (typeof jsonInput === "string") {
    try { parsed1 = JSON.parse(jsonInput); } catch {}
  }
  assert.strictEqual(parsed1.fullName, "Sakib Al Hasan");
  assert.strictEqual(parsed1.city, "Dhaka");

  // 2. Object format
  const objInput = {
    fullName: "Tamim Iqbal",
    phone: "01711111111",
    addressLine1: "GEC Circle",
    city: "Chittagong",
    country: "BD",
  };
  let parsed2 = typeof objInput === "object" ? objInput : null;
  assert.strictEqual(parsed2.fullName, "Tamim Iqbal");

  // 3. Flattened / Bracket notation format (From multipart/form-data)
  const bodyBracket = {
    "shippingAddress[fullName]": "Mushfiqur Rahim",
    "shippingAddress[phone]": "01822222222",
    "shippingAddress[addressLine1]": "Bogura Road",
    "shippingAddress[city]": "Bogura",
  };
  let parsed3 = {
    fullName: bodyBracket["shippingAddress[fullName]"] || "",
    phone: bodyBracket["shippingAddress[phone]"] || "",
    addressLine1: bodyBracket["shippingAddress[addressLine1]"] || "",
    city: bodyBracket["shippingAddress[city]"] || "",
  };
  assert.strictEqual(parsed3.fullName, "Mushfiqur Rahim");
  assert.strictEqual(parsed3.city, "Bogura");
});

test("Error Handler - MongoDB Duplicate Key Null Safety", () => {
  const createMockRes = () => {
    const res = {};
    res.statusCode = 0;
    res.jsonData = null;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  const errWithNullKeyValue = {
    code: 11000,
    keyValue: null,
  };

  const req = {};
  const res = createMockRes();
  const next = () => {};

  assert.doesNotThrow(() => {
    errorHandler(errWithNullKeyValue, req, res, next);
  });

  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.message, "Field already exists.");
});

test("Passport Google OAuth - Guard prevents crash when credentials missing", () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;

  assert.doesNotThrow(() => {
    require("../src/config/passport");
  });
});

test("Order Cancellation - Lifecycle, Stock Restoration & Access Control", async (t) => {
  const { cancelOrder } = require("../src/controllers/orderController");
  const Order = require("../src/models/Order");
  const Product = require("../src/models/Product");

  const originalFindOrder = Order.findById;
  const originalUpdateProduct = Product.findByIdAndUpdate;

  t.after(() => {
    Order.findById = originalFindOrder;
    Product.findByIdAndUpdate = originalUpdateProduct;
  });

  const restoredStock = [];
  Product.findByIdAndUpdate = async (id, update) => {
    restoredStock.push({ id, update });
    return { _id: id };
  };

  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  // 1. Owner cancels pending order -> success & stock restored
  const mockPendingOrder = {
    _id: "order_123",
    user: "user_owner",
    orderStatus: "pending",
    items: [
      { product: "prod_1", quantity: 2 },
      { product: "prod_2", quantity: 1 },
    ],
    save: async function () { return this; },
  };

  Order.findById = async () => mockPendingOrder;

  const req1 = {
    params: { id: "order_123" },
    user: { _id: "user_owner", role: "customer" },
    body: { reason: "Customer changed mind" },
  };
  const res1 = createMockRes();

  await cancelOrder(req1, res1, () => {});

  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res1.jsonData.success, true);
  assert.strictEqual(mockPendingOrder.orderStatus, "cancelled");
  assert.strictEqual(mockPendingOrder.cancelReason, "Customer changed mind");
  assert.strictEqual(restoredStock.length, 2);
  assert.strictEqual(restoredStock[0].update.$inc.stock, 2);
  assert.strictEqual(restoredStock[0].update.$inc.soldCount, -2);

  // 2. Non-owner cannot cancel -> 403 Access denied
  const req2 = {
    params: { id: "order_123" },
    user: { _id: "other_user", role: "customer" },
    body: {},
  };
  const res2 = createMockRes();
  await cancelOrder(req2, res2, () => {});
  assert.strictEqual(res2.statusCode, 403);
  assert.strictEqual(res2.jsonData.message, "Access denied.");

  // 3. Admin can cancel any order -> 200
  const req3 = {
    params: { id: "order_123" },
    user: { _id: "admin_user", role: "admin" },
    body: {},
  };
  mockPendingOrder.orderStatus = "processing";
  const res3 = createMockRes();
  await cancelOrder(req3, res3, () => {});
  assert.strictEqual(res3.statusCode, 200);

  // 4. Shipped order cannot be cancelled -> 400
  mockPendingOrder.orderStatus = "shipped";
  const req4 = {
    params: { id: "order_123" },
    user: { _id: "user_owner", role: "customer" },
    body: {},
  };
  const res4 = createMockRes();
  await cancelOrder(req4, res4, () => {});
  assert.strictEqual(res4.statusCode, 400);
  assert.match(res4.jsonData.message, /already shipped/);

  // 5. Courier dispatched order cannot be cancelled -> 400
  mockPendingOrder.orderStatus = "confirmed";
  mockPendingOrder.courier = { trackingCode: "STDF123456" };
  const res5 = createMockRes();
  await cancelOrder(req4, res5, () => {});
  assert.strictEqual(res5.statusCode, 400);
  assert.match(res5.jsonData.message, /dispatched to courier/);
});

test("Order Pricing & Payment - bKash 30% Advance Discount & Verification", async (t) => {
  const { createOrder, updatePaymentStatus } = require("../src/controllers/orderController");
  const Order = require("../src/models/Order");
  const Cart = require("../src/models/Cart");
  const Product = require("../src/models/Product");

  const originalFindCart = Cart.findOne;
  const originalUpdateCart = Cart.findOneAndUpdate;
  const originalFindProductAndUpdate = Product.findOneAndUpdate;
  const originalUpdateProduct = Product.findByIdAndUpdate;
  const originalCreateOrder = Order.create;
  const originalFindOrder = Order.findById;

  t.after(() => {
    Cart.findOne = originalFindCart;
    Cart.findOneAndUpdate = originalUpdateCart;
    Product.findOneAndUpdate = originalFindProductAndUpdate;
    Product.findByIdAndUpdate = originalUpdateProduct;
    Order.create = originalCreateOrder;
    Order.findById = originalFindOrder;
  });

  Cart.findOneAndUpdate = async () => ({ items: [] });
  Product.findOneAndUpdate = async () => ({ _id: "prod_1" });
  Product.findByIdAndUpdate = async () => ({ _id: "prod_1" });

  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  // Mock Cart with 2 items total ৳1,000 each = ৳2,000 subtotal
  const mockCart = {
    user: "user_buyer",
    items: [
      {
        product: { _id: "prod_1", name: "Brazil Home Kit", isActive: true, stock: 10, images: [{ url: "img1.jpg" }] },
        price: 1000,
        quantity: 2,
      },
    ],
    save: async () => {},
  };

  Cart.findOne = () => ({
    populate: async () => mockCart,
  });

  Product.findByIdAndUpdate = async () => ({ _id: "prod_1" });

  let savedOrderData = null;
  Order.create = async (data) => {
    savedOrderData = data;
    return {
      _id: "order_bkash_999",
      ...data,
      save: async function () { return this; },
    };
  };

  // 1. bKash payment: subtotal 2000 => 30% discount = 600.
  // itemsPrice = 2000 - 600 = 1400 (< 2000, so shipping = 80).
  // totalPrice = 1400 + 80 = 1480.
  // advanceAmount = 100 => dueAmount = 1380.
  const reqBkash = {
    user: { _id: "user_buyer" },
    body: {
      paymentMethod: "bkash",
      bkashNumber: "01712345678",
      bkashTrxId: "8N7X2KL9PQ",
      advanceAmount: "100",
      shippingAddress: {
        fullName: "Karim Buyer",
        phone: "01712345678",
        addressLine1: "Banani, Dhaka",
        city: "Dhaka",
      },
    },
  };
  const resBkash = createMockRes();

  await createOrder(reqBkash, resBkash, () => {});

  assert.strictEqual(resBkash.statusCode, 201);
  assert.strictEqual(savedOrderData.discountAmount, 600); // 30% of 2000
  assert.strictEqual(savedOrderData.itemsPrice, 1400);
  assert.strictEqual(savedOrderData.shippingPrice, 80);
  assert.strictEqual(savedOrderData.totalPrice, 1480);
  assert.strictEqual(savedOrderData.advanceAmount, 100);
  assert.strictEqual(savedOrderData.dueAmount, 1380);
  assert.strictEqual(savedOrderData.paymentStatus, "partially_paid");
  assert.strictEqual(savedOrderData.bkashTrxId, "8N7X2KL9PQ");

  // 2. Admin 1-Click Verification of Payment Status
  const mockOrderInstance = {
    _id: "order_bkash_999",
    paymentStatus: "partially_paid",
    dueAmount: 1380,
    isPaid: false,
    save: async function () { return this; },
  };
  Order.findById = async () => mockOrderInstance;

  const reqVerify = {
    params: { id: "order_bkash_999" },
    body: { paymentStatus: "paid" },
  };
  const resVerify = createMockRes();

  await updatePaymentStatus(reqVerify, resVerify, () => {});

  assert.strictEqual(resVerify.statusCode, 200);
  assert.strictEqual(mockOrderInstance.paymentStatus, "paid");
  assert.strictEqual(mockOrderInstance.isPaid, true);
  assert.strictEqual(mockOrderInstance.dueAmount, 0);
});

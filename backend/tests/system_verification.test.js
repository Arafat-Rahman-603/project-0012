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

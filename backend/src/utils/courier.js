/**
 * Courier Integration for Bangladesh
 * Supports Steadfast Courier & Pathao Courier
 */

/**
 * Dispatch an order to Steadfast Courier
 * @param {Object} order - Mongoose order document
 * @param {Object} config - { apiKey, secretKey }
 */
async function dispatchToSteadfast(order, config) {
  const apiKey = config?.apiKey || process.env.STEADFAST_API_KEY;
  const secretKey = config?.secretKey || process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Steadfast API Key and Secret Key are required.");
  }

  const recipientAddress = [
    order.shippingAddress.addressLine1,
    order.shippingAddress.addressLine2,
    order.shippingAddress.city,
    order.shippingAddress.state,
  ]
    .filter(Boolean)
    .join(", ");

  const payload = {
    invoice: order.orderNumber,
    recipient_name: order.shippingAddress.fullName,
    recipient_phone: order.shippingAddress.phone,
    recipient_address: recipientAddress || "Dhaka, Bangladesh",
    cod_amount: order.isPaid ? 0 : Math.round(order.totalPrice),
    note: order.notes ? String(order.notes).slice(0, 200) : "Handle with care",
  };

  const response = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || (data && data.status !== 200)) {
    const errorMsg =
      data?.errors
        ? Object.values(data.errors).flat().join(", ")
        : data?.message || "Failed to create order on Steadfast.";
    throw new Error(`Steadfast Error: ${errorMsg}`);
  }

  const consignment = data?.consignment || {};
  return {
    provider: "steadfast",
    consignmentId: String(consignment.consignment_id || consignment.id || ""),
    trackingCode: String(consignment.tracking_code || ""),
    status: consignment.status || "in_review",
    raw: data,
  };
}

/**
 * Check delivery status from Steadfast Courier
 */
async function trackSteadfast(identifier, config) {
  const apiKey = config?.apiKey || process.env.STEADFAST_API_KEY;
  const secretKey = config?.secretKey || process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Steadfast API credentials missing.");
  }

  // Can track by invoice or consignment ID
  const isInvoice = String(identifier).startsWith("ORD-");
  const endpoint = isInvoice
    ? `https://portal.steadfast.com.bd/api/v1/status_by_invoice/${encodeURIComponent(identifier)}`
    : `https://portal.steadfast.com.bd/api/v1/status_by_cid/${encodeURIComponent(identifier)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || (data && data.status !== 200)) {
    throw new Error(data?.message || "Could not retrieve Steadfast tracking info.");
  }

  return {
    provider: "steadfast",
    deliveryStatus: data.delivery_status || data.status || "unknown",
    raw: data,
  };
}

/**
 * Pathao Issue Access Token
 */
async function getPathaoToken(config) {
  const clientId = config?.clientId || process.env.PATHAO_CLIENT_ID;
  const clientSecret = config?.clientSecret || process.env.PATHAO_CLIENT_SECRET;
  const username = config?.username || process.env.PATHAO_CLIENT_EMAIL;
  const password = config?.password || process.env.PATHAO_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Pathao credentials (client ID, secret, username, password) are required.");
  }

  const response = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/issue-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      grant_type: "password",
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.message || "Failed to authenticate with Pathao API.");
  }

  return data.access_token;
}

/**
 * Dispatch an order to Pathao Courier
 */
async function dispatchToPathao(order, config) {
  const token = await getPathaoToken(config);
  const storeId = config?.storeId || process.env.PATHAO_STORE_ID;

  if (!storeId) {
    throw new Error("Pathao Store ID is required.");
  }

  const recipientAddress = [
    order.shippingAddress.addressLine1,
    order.shippingAddress.addressLine2,
    order.shippingAddress.city,
  ]
    .filter(Boolean)
    .join(", ");

  const payload = {
    store_id: Number(storeId),
    merchant_order_id: order.orderNumber,
    recipient_name: order.shippingAddress.fullName,
    recipient_phone: order.shippingAddress.phone,
    recipient_address: recipientAddress || "Dhaka, Bangladesh",
    recipient_city: 1, // Default city Dhaka
    recipient_zone: 1,
    delivery_type: 48, // Normal delivery
    item_type: 2, // Parcel
    special_instruction: order.notes ? String(order.notes).slice(0, 150) : "",
    item_quantity: order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1,
    item_weight: 0.5,
    amount_to_collect: order.isPaid ? 0 : Math.round(order.totalPrice),
    item_description: `Order ${order.orderNumber}`,
  };

  const response = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.data?.consignment_id) {
    throw new Error(data?.message || "Failed to create order on Pathao.");
  }

  return {
    provider: "pathao",
    consignmentId: String(data.data.consignment_id),
    trackingCode: String(data.data.consignment_id),
    status: data.data.order_status || "Pending",
    raw: data,
  };
}

module.exports = {
  dispatchToSteadfast,
  trackSteadfast,
  dispatchToPathao,
};


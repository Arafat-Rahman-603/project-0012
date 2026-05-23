const successResponse = (res, data = {}, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

const errorResponse = (res, message = "Something went wrong", statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

const paginatedResponse = (res, data, total, page, limit, message = "Success") =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });

module.exports = { successResponse, errorResponse, paginatedResponse };

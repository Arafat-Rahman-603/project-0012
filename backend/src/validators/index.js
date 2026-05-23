const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required.");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters.");
  if (password && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) errors.push("Password must contain at least one letter and one number.");

  if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }
  next();
};

const validateProduct = (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2) errors.push("Product name is required.");
  if (!description) errors.push("Description is required.");
  if (!price || isNaN(price) || price < 0) errors.push("Valid price is required.");
  if (!category) errors.push("Category is required.");
  if (stock === undefined || isNaN(stock) || stock < 0) errors.push("Valid stock quantity is required.");
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });
  next();
};

module.exports = { validateRegister, validateLogin, validateProduct };

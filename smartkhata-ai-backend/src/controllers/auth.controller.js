const Business = require('../models/Business');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const sendAuthResponse = (res, user, statusCode = 200) => {
  const businessName = user.business?.businessName || '';

  return res.status(statusCode).json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      businessName,
    },
  });
};

const register = async (req, res, next) => {
  try {
    const { fullName, businessName, email, password } = req.body;

    if (!fullName || !businessName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, businessName, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
    });

    const business = await Business.create({
      owner: user._id,
      businessName,
    });

    user.business = business._id;
    await user.save();
    await user.populate('business');

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('business');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      business: req.user.business,
    },
  });
};

module.exports = {
  getMe,
  login,
  register,
};

const crypto = require('crypto');

const { OAuth2Client } = require('google-auth-library');

const Business = require('../models/Business');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const googleClient = new OAuth2Client();

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

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google sign-in is not configured on the server.',
      });
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: 'Google account could not be verified.',
      });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    }).populate('business');

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
      }

      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
      }

      if (!user.business) {
        const business = await Business.create({
          owner: user._id,
          businessName: `${user.fullName}'s Business`,
        });
        user.business = business._id;
      }

      await user.save();
      await user.populate('business');

      return sendAuthResponse(res, user);
    }

    user = await User.create({
      fullName: payload.name || email.split('@')[0],
      email,
      password: crypto.randomBytes(24).toString('hex'),
      authProvider: 'google',
      googleId: payload.sub,
    });

    const business = await Business.create({
      owner: user._id,
      businessName: `${user.fullName}'s Business`,
    });

    user.business = business._id;
    await user.save();
    await user.populate('business');

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    if (error.message?.includes('Wrong recipient')) {
      return res.status(401).json({
        success: false,
        message: 'Google credential is not valid for this app.',
      });
    }

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
  googleLogin,
  login,
  register,
};

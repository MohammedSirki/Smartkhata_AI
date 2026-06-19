const Business = require('../models/Business');
const User = require('../models/User');

const profilePayload = (user, business) => ({
  fullName: user.fullName || '',
  ownerName: user.fullName || '',
  businessName: business?.businessName || '',
  email: user.email || '',
  phone: business?.phone || '',
  gstNumber: business?.gstNumber || '',
  currency: business?.currency || '',
  language: business?.language || '',
});

const getBusinessId = (user) => user.business?._id || user.business;

const getProfile = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req.user);
    const business = businessId ? await Business.findById(businessId) : null;

    return res.json({
      success: true,
      data: profilePayload(req.user, business),
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, ownerName, businessName, email, phone, gstNumber, currency, language } = req.body;
    const businessId = getBusinessId(req.user);

    const userUpdates = {};
    if (fullName !== undefined || ownerName !== undefined) userUpdates.fullName = fullName ?? ownerName;
    if (email !== undefined) userUpdates.email = email;

    const user =
      Object.keys(userUpdates).length > 0
        ? await User.findByIdAndUpdate(req.user._id, userUpdates, {
            new: true,
            runValidators: true,
          })
        : req.user;

    let business = businessId ? await Business.findById(businessId) : null;

    if (!business && businessName) {
      business = await Business.create({
        owner: req.user._id,
        businessName,
      });
      await User.findByIdAndUpdate(req.user._id, { business: business._id });
    }

    if (business) {
      if (businessName !== undefined) business.businessName = businessName;
      if (phone !== undefined) business.phone = phone;
      if (gstNumber !== undefined) business.gstNumber = gstNumber;
      if (currency !== undefined) business.currency = currency;
      if (language !== undefined) business.language = language;
      await business.save();
    }

    return res.json({
      success: true,
      data: profilePayload(user, business),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

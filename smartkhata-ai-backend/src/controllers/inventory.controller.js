const InventoryItem = require('../models/InventoryItem');
const { normalizeItemName } = require('../utils/itemMatcher');

const getBusinessId = (user) => user.business?._id || user.business;

const getInventory = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ user: req.user._id }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    return next(error);
  }
};

const createInventoryItem = async (req, res, next) => {
  try {
    const { name, stock = 0, costPrice = 0, sellingPrice = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required.',
      });
    }

    const item = await InventoryItem.create({
      user: req.user._id,
      business: getBusinessId(req.user),
      name: normalizeItemName(name),
      normalizedName: normalizeItemName(name),
      stock,
      costPrice,
      sellingPrice,
    });

    return res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Inventory item already exists.',
      });
    }

    return next(error);
  }
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found.',
      });
    }

    if (req.body.name !== undefined) {
      item.name = normalizeItemName(req.body.name);
      item.normalizedName = normalizeItemName(req.body.name);
    }
    if (req.body.stock !== undefined) item.stock = req.body.stock;
    if (req.body.costPrice !== undefined) item.costPrice = req.body.costPrice;
    if (req.body.sellingPrice !== undefined) item.sellingPrice = req.body.sellingPrice;

    await item.save();

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Inventory item already exists.',
      });
    }

    return next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Inventory item deleted.',
      data: item,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  updateInventoryItem,
};

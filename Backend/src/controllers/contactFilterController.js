const { ContactFilter } = require("../models/associations");

exports.getFilters = async (req, res) => {
  try {
    const userId = req.userId;
    let filters = await ContactFilter.findOne({ where: { userId } });

    if (!filters) {
      // Create defaults
      filters = await ContactFilter.create({ userId });
    }

    res.status(200).json({ success: true, data: filters });
  } catch (error) {
    console.error("Get contact filters error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateFilters = async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;

    let filters = await ContactFilter.findOne({ where: { userId } });

    if (filters) {
      filters = await filters.update(data);
    } else {
      filters = await ContactFilter.create({ ...data, userId });
    }

    res.status(200).json({
      success: true,
      message: "Contact filters saved successfully",
      data: filters,
    });
  } catch (error) {
    console.error("Update contact filters error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

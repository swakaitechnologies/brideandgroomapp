const { Banner } = require("../models/associations");

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
    });
  }
};

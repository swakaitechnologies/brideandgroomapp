const { Request, User, Profile } = require("../models/associations");

exports.getAllRequests = async (req, res) => {
    console.log("Admin API: Fetching all requests");
    try {
        const requests = await Request.findAll({
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "email", "mobile"],
                    include: [
                        {
                            model: Profile,
                            as: "profile",
                            attributes: ["firstName", "lastName", "customId"]
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Get all requests error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.resolveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminComment } = req.body;

        const request = await Request.findByPk(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Request already resolved" });
        }

        request.status = status;
        request.adminId = req.admin.id;
        request.adminComment = adminComment;
        await request.save();

        // If approved and type is mobile_change, update the User model
        if (status === "approved" && request.type === "mobile_change") {
            const user = await User.findByPk(request.userId);
            if (user) {
                user.mobile = request.newValue;
                await user.save();
            }
        }

        res.status(200).json({ success: true, message: `Request ${status} successfully`, data: request });
    } catch (error) {
        console.error("Resolve request error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

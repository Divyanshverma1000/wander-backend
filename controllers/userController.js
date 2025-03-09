const User = require("../models/User");
const Notification = require("../models/Notifications")

//GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("friends")
      .populate("tripHistory")
      .populate("publicPosts");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//POST /api/users/add-friend
exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.user.userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Friend already added" });
    }
    user.friends.push(friendId);
    await user.save();
    res.json({ message: "Friend added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//PUT /api/users/profile-photo
exports.updateProfilePhoto = async (req, res) => {
  console.log("uploading profile photo");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path; // Cloudinary URL
    const user = await User.findByIdAndUpdate(
      req.user.userId, // Extracted from authMiddleware
      { photo: imageUrl },
      { new: true }
    );

    res.json({ message: "Profile picture updated", photo: user.photo });
  } catch (err) {
    console.error("Error updating profile picture:", err); // Log error
    res.status(500).json({ error: "Server Error" }); // Send JSON, not object
  }
}

//GET /api/users/get-notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// //GET /api/users/seach/qurey=name
// exports.searchUser = async(req , res) => {
//   try {
//     const { name } = req.query;
//     if (!name) return res.status(400).json({ message: "Name is required" });

//     const users = await User.find({ name: { $regex: name, $options: "i" } }); // Case-insensitive search
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: "Server Error" });
//   }
// }

// GET /api/users/search?query=...
exports.searchUser = async(req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search by name or email, exclude current user
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
          ]
        }
      ]
    })
    .select('_id name email photo') // Only return necessary fields
    .limit(20); // Limit results

    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: "Server Error" });
  }
};

const express = require("express");
const router = express.Router();
const { getProfile, addFriend, updateProfilePhoto, searchUser, removeProfilePhoto, getAllUsers, deleteUserById, updatePushToken } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload")

//GET /api/users/profile
router.get("/profile", authMiddleware, getProfile);
//POST /api/users/add-friend
router.post("/add-friend", authMiddleware, addFriend);
//PUT /api/users/profilephoto
router.put("/profile-photo", authMiddleware, upload.single('photo'), updateProfilePhoto);
//PUT /api/users/profile-photo/remove
router.put("/profile-photo/remove", authMiddleware, removeProfilePhoto);
//GET /api/users/get-notification
// router.get("/get-notifications", authMiddleware, getNotifications);
//GET /api/users/search?name=name
router.get("/search", authMiddleware, searchUser);
//GET /api/users/all-users
router.get("/all-users", authMiddleware, getAllUsers);
//DELETE /api/users/:id
router.delete("/:id", authMiddleware, deleteUserById);
//POST /api/users/push-token
router.post('/push-token', authMiddleware, updatePushToken);

module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");

// POST /wishlist/:id — Toggle a listing in wishlist
router.post(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    const listingId = req.params.id;

    const idx = user.wishlist.findIndex((id) => id.toString() === listingId);
    if (idx === -1) {
      user.wishlist.push(listingId);
      await user.save();
      return res.json({ saved: true });
    } else {
      user.wishlist.splice(idx, 1);
      await user.save();
      return res.json({ saved: false });
    }
  })
);

// GET /wishlist — View all saved listings
router.get(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("wishlist/index", { wishlist: user.wishlist });
  })
);

module.exports = router;
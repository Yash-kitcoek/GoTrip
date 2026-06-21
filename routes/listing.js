const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const Listing = require("../models/listing");

const { validateListing, isLoggedIn } = require("../middleware");

const cleanListingData = (listing = {}) => {
  const amenities = listing.amenities
    ? Array.isArray(listing.amenities)
      ? listing.amenities
      : [listing.amenities]
    : [];

  return {
    ...listing,
    amenities: amenities.filter(Boolean),
    instantBook: listing.instantBook === "on" || listing.instantBook === true,
    cleaningFee: Number(listing.cleaningFee) || 0,
    serviceFee: Number(listing.serviceFee) || 0,
  };
};

// ===== Owner Middleware =====
const isOwner = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  if (!req.user || listing.owner.toString() !== req.user._id.toString()) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect("/listings");
  }
  next();
});

// ===== All Listings =====

router.get(
  "/search",
  wrapAsync(async (req, res) => {
    const { q, minPrice, maxPrice, guests, instantBook } = req.query;
    if (!q || q.trim() === "") return res.redirect("/listings");
 
    const regex = new RegExp(q.trim(), "i");
    const filters = {
      $or: [
        { title: regex },
        { location: regex },
        { country: regex },
        { description: regex },
        { category: regex },
      ],
    };

    if (minPrice) filters.price = { ...filters.price, $gte: Number(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, $lte: Number(maxPrice) };
    if (guests) filters.maxGuests = { $gte: Number(guests) };
    if (instantBook === "on") filters.instantBook = true;

    const results = await Listing.find(filters).populate("owner");
 
    res.render("listings/search", { results, query: q, filters: req.query });
  })
);

router.get(
  "/",
  wrapAsync(async (req, res) => {
    const { category, minPrice, maxPrice, guests, instantBook } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (guests) filter.maxGuests = { $gte: Number(guests) };
    if (instantBook === "on") filter.instantBook = true;
    const allListings = await Listing.find(filter).populate("owner");
    res.render("listings/index", { allListings, category: category || null, filters: req.query });
  })
);

// ===== New Listing Form =====
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// ===== Create Listing =====
router.post(
  "/",
  isLoggedIn,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {
    const newListing = new Listing(cleanListingData(req.body.listing));
    newListing.owner = req.user._id;

    // Image upload
    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    let savedListing = await newListing.save();
    console.log("Saved Listing:", savedListing);

    req.flash("success", "New listing created successfully!");
    res.redirect(`/listings/${newListing._id}`);
  })
);

// ===== Show Listing =====
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    res.render("listings/show", { listing });
  })
);

// ===== Edit Listing Form =====
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
  })
);

// ===== Update Listing =====
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
      id,
      cleanListingData(req.body.listing),
      { new: true, runValidators: true }
    );

    // Update image if file uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
      await listing.save();
    }

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
  })
);

// ===== Delete Listing =====
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  })
);

module.exports = router;

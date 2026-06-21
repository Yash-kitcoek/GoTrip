const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");

// POST /listings/:id/bookings — Create a booking
router.post(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    const { checkIn, checkOut, guests } = req.body.booking;
    const guestCount = Number(guests);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      req.flash("error", "Check-out date must be after check-in date.");
      return res.redirect(`/listings/${listing._id}`);
    }

    if (checkInDate < new Date()) {
      req.flash("error", "Check-in date cannot be in the past.");
      return res.redirect(`/listings/${listing._id}`);
    }

    if (guestCount > listing.maxGuests) {
      req.flash("error", `This stay can host up to ${listing.maxGuests} guest(s).`);
      return res.redirect(`/listings/${listing._id}`);
    }

    // Check for conflicting bookings
    const conflict = await Booking.findOne({
      listing: listing._id,
      status: { $ne: "cancelled" },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    if (conflict) {
      req.flash("error", "These dates are already booked. Please choose different dates.");
      return res.redirect(`/listings/${listing._id}`);
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const subtotal = nights * listing.price;
    const feeTotal = (listing.cleaningFee || 0) + (listing.serviceFee || 0);
    const tax = Math.round((subtotal + feeTotal) * 0.18);
    const totalPrice = subtotal + feeTotal + tax;

    const newBooking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestCount,
      totalPrice,
    });

    await newBooking.save();
    req.flash("success", `Booking confirmed! ${nights} night(s) for ₹${totalPrice.toLocaleString("en-IN")}`);
    res.redirect("/bookings/my");
  })
);

// GET /bookings/my — View all user's bookings
router.get(
  "/my",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ checkIn: 1 });
    res.render("bookings/my", { bookings });
  })
);

// DELETE /bookings/:bookingId — Cancel a booking
router.delete(
  "/:bookingId",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/bookings/my");
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      req.flash("error", "You cannot cancel this booking.");
      return res.redirect("/bookings/my");
    }
    booking.status = "cancelled";
    await booking.save();
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings/my");
  })
);

module.exports = router;

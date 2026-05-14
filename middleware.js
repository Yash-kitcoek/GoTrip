const { listingSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing");

// Check if user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl; // save original URL
        req.flash("error", "You must be logged in!");
        return res.redirect("/login");
    }
    next();
};

// Validate listing data
module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        // FIX #1: ExpressError(statusCode, message) — arguments were swapped
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};

// Save redirect URL after login
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.redirectUrl = req.session.returnTo;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    // FIX #2: was `listing.findById(id)` — lowercase `listing` is undefined here; must be `Listing` (the model)
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of the listing");
        // FIX #3: was '/listings/${id}' (single quotes) — template literals require backticks
        return res.redirect(`/listings/${id}`);
    }
    next();
};
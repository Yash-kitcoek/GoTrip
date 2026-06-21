const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews");

const listingSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    image: {
       url: String,
       filename: String,
    },
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: ["Trending", "Rooms", "Iconic cities", "Mountains", "Castles", "Arctic", "Camping", "farms", "domes", "Boats"],
        default: "Trending"
    },
    maxGuests: {
        type: Number,
        min: 1,
        default: 2,
    },
    bedrooms: {
        type: Number,
        min: 0,
        default: 1,
    },
    beds: {
        type: Number,
        min: 1,
        default: 1,
    },
    bathrooms: {
        type: Number,
        min: 0,
        default: 1,
    },
    amenities: {
        type: [String],
        default: [],
    },
    houseRules: {
        type: String,
        default: "No parties or events. Please respect quiet hours and keep the place tidy.",
    },
    checkInTime: {
        type: String,
        default: "14:00",
    },
    checkOutTime: {
        type: String,
        default: "11:00",
    },
    cleaningFee: {
        type: Number,
        min: 0,
        default: 0,
    },
    serviceFee: {
        type: Number,
        min: 0,
        default: 0,
    },
    instantBook: {
        type: Boolean,
        default: false,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

module.exports = mongoose.model("Listing", listingSchema);

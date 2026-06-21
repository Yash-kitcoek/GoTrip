const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid("Trending", "Rooms", "Iconic cities", "Mountains", "Castles", "Arctic", "Camping", "farms", "domes", "Boats").required(),
        maxGuests: Joi.number().integer().min(1).max(20).required(),
        bedrooms: Joi.number().integer().min(0).max(20).required(),
        beds: Joi.number().integer().min(1).max(30).required(),
        bathrooms: Joi.number().min(0).max(20).required(),
        amenities: Joi.alternatives().try(
            Joi.array().items(Joi.string().trim().max(40)),
            Joi.string().trim().max(40)
        ).optional(),
        houseRules: Joi.string().allow("", null).max(1000),
        checkInTime: Joi.string().allow("", null).max(20),
        checkOutTime: Joi.string().allow("", null).max(20),
        cleaningFee: Joi.number().min(0).default(0),
        serviceFee: Joi.number().min(0).default(0),
        instantBook: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("on")).optional(),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});

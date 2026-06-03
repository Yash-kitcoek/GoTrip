// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require("connect-mongo").default;
const ExpressError = require("./utils/ExpressError.js");

// Routers
const listingRouter  = require("./routes/listing.js");
const reviewRouter   = require("./routes/review.js");
const userRouter     = require("./routes/user.js");
const bookingRouter  = require("./routes/booking.js");
const wishlistRouter = require("./routes/wishlist.js");

// ── Database ──────────────────────────────────────────────────
const dburl = process.env.ATLASDB_URL;

mongoose
  .connect(dburl)
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.log("❌ DB connection error:", err));

// ── View engine ───────────────────────────────────────────────
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ── Core middleware ───────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ── Session store (MongoDB) ───────────────────────────────────
const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ── Passport ──────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ── Locals middleware ─────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.success  = req.flash("success");
  res.locals.error    = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});

// ── Demo user route ───────────────────────────────────────────
app.get("/demouser", async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ username: "delta-student" });
    if (existingUser) {
      req.flash("error", "Demo user already exists!");
      return res.redirect("/listings");
    }
    const fakeUser = new User({ email: "student@gmail.com", username: "delta-student" });
    const registeredUser = await User.register(fakeUser, "helloworld");
    req.flash("success", "Demo user created successfully!");
    res.send(registeredUser);
  } catch (err) {
    next(err);
  }
});

// ── Routes ────────────────────────────────────────────────────
app.get("/", (req, res) => res.redirect("/listings"));

app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings/:id/bookings", bookingRouter);
app.use("/bookings", bookingRouter);
app.use("/wishlist", wishlistRouter);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).render("error", {
    err: { message: "Page not found", statusCode: 404 },
  });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { err: { message, statusCode } });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
require("dotenv").config();
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static("public"));
require("./models/mongodb");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: "your_secret_key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 }, // 7 days in milliseconds
  })
);

const publicUsers = require("./routes/publicUsersRoute");
app.use("/", publicUsers);

const userRoute = require("./routes/userRoute");
app.use("/user", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

// Session middleware

// Other middleware (like body-parser, if needed)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------Google Login---------------------------
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if a user with the same email already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Check if the user is blocked
          if (user.status === "blocked") {
            return done(null, false, {
              message: `${profile.emails[0].value} is blocked`,
            });
          }

          // Update the existing user with the googleId
          user.googleId = profile.id;
        } else {
          // Create a new user if no existing user is found
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName,
            email: profile.emails[0].value,
          });
        }

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

app.use((req, res, next) => {
  req.session.admin = true;
  console.log(1);
  next();
});

app.get("/", (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    failureMessage: true,
  }),
  (req, res) => {
    if (req.authInfo && req.authInfo.message) {
      return res.render("user/userLogin", { error: req.authInfo.message });
    }
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  res.send(`Welcome ${req.user.fullName}`);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.listen(3000, () => {
  console.log(`Server is running at port 3000`);
});

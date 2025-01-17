require("dotenv").config();
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");
const nocache = require("nocache");

app.set("view engine", "ejs");
app.use(express.static("public"));
require("./models/mongodb");



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(nocache());

app.use(
  session({
    secret: "123456755",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 },
  })
);

const getCartAndWishlistQuantity = require("./middleware/cartAndWishlistIconQtyMiddleware");
app.use(getCartAndWishlistQuantity);

// app.use((req, res, next) => {
//   req.session.user = {
//     _id: "676eabd20e34593b603fb0a8",
//     fullName: "Arun b chandran",
//     email: "arunbchandran100@gmail.com",
//     password: "$2a$10$fk3CxhoyRYD2yXd7O6QFuOUlf1OT1eWZqG84TbYkhG6xIfUhrK5l.",
//     status: "active",
//     __v: 0,
//   };
//   next();
// });

///////////////////////////////



// const navbarUsername = require("../middleware/navbarUsername");

const navbarUsername = require("./middleware/navbarUsername");

app.use(navbarUsername);

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

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
      callbackURL: process.env.callbackURI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });


        // console.log("google user details " +user)
        if (user) {
          if (user.status === "blocked") {
            return done(null, false, {
              message: `${profile.emails[0].value} is blocked`,
            });
            // return res.render("user/userLogin", {
            // error: `${user.email} is blocked`,
            // });
          }

          user.googleId = profile.id;
        } else {
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

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);


app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return res.status(500).render("user/userLogin", {
        error: "An error occurred during authentication.",
      });
    }

    if (!user && info && info.message) { 
      // Display the block message
      return res.render("user/userLogin", { error: info.message });
    }

    // Successful login
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).render("user/userLogin", {
          error: "Failed to log in the user.",
        });
      }

      // Update the session with the user data
      req.session.user = user;
      //console.log(user);
      res.redirect("/user/profile");
    });
  })(req, res, next);
});



app.use((req, res, next) => {
  res.status(404).render("publicUser/partials/404", { title: "Page Not Found" });
});


let PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});


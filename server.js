const express = require("express");
const app = express();
app.set("view engine", "ejs"); 
app.use(express.static("public"));
require("./models/mongodb");
const path = require("path");
require("dotenv").config();


// const session = require("express-session");
// const nocache = require("nocache");
// app.set("view engine", "ejs");
// const path = require("path");
// app.set("views", path.join(__dirname, "views"));

// app.use(nocache());

// app.use(
//   session({
//     secret: "password",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


const publicUsers = require("./routes/publicUsersRoute")
app.use("/", publicUsers)

const userRoute = require("./routes/userRoute");
app.use("/user", userRoute);

// const adminRoute = require("./routes/admin");
// app.use("/admin", adminRoute);

app.listen(3000, () => {
  console.log("running at 3000");
});

app.use(express.static(path.join(__dirname, "public")));

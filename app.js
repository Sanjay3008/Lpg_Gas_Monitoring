
const express = require("express");
const ejs = require("ejs");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
var passport = require('passport');

const {
    ensureAuthenticated
} = require("./config/auth");
const arealist = require("countrycitystatejson");
var country = [];
//modal
const User = require("./Modals/user");
const distributer = require("./Modals/distributer");

//predict_gas
const gas_data = require("./gasprediction/gaspredict");

const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");



//passport config
require("./config/passport")(passport);

//bodyparser
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(function (req, res, next) {

    if (!req.user)
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});
// expression sessoin
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))


//passport middleware
app.use(passport.initialize({
    userProperty: 'roomUser'
}));
app.use(passport.session());



//connect-flash 
app.use(flash());
//global variables

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
// access public files
app.use(express.static("public"));

//lpg database
const db = require("./config/keys").MongoURI;
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true  
}).then(() => console.log("Mongo db connected")).catch(err => console.log(err));

// data to ejs
var distributer_table = distributer.find({});
var user_table = User.find({});
var userinfo;
var distinfo;
//get rquest---------------------------------------

app.get("/", function (req, res) {

    //    res.sendFile(__dirname+"/citystate.html")
    res.render("home");
    //    console.log(distinfo);



});
app.get("/login", function (req, res) {
    res.render("login", {
        class1: "active",
        class2: ""
    });
});
app.get("/register", function (req, res) {
    res.render("register", {
        class1: "active",
        class2: ""
    });
});
app.get("/dashboard_user", ensureAuthenticated, (req, res) => {
    res.render("dashboard_user", {
        first_name: req.roomUser.name.firstname,
        last_name: req.roomUser.name.lastname
    });
});
app.get("/dashboard_distributer", ensureAuthenticated, (req, res) => {

    distributer_table.exec(function (err, data) {
        if (err) {
            console.log(err);
        }
        distinfo = data;
        console.log()
    })
    user_table.exec(function (err, data) {
        if (err) {
            console.log(err);
        }
        userinfo = data;
        res.render("distributer_dashboard", {
            distributor_record: distinfo,
            user_record: userinfo,
            contents:""
        });

    })

});

//logout handler
app.get("/logout_user", (req, res) => {
    req.logout();
    req.flash("success_msg", "You are logged out");
    res.redirect("/login");
})
app.get("/logout_distributer", (req, res) => {
    req.logout();
    req.flash("success_msg", "You are logged out");
    req.session.destroy(function (err) {
        res.redirect('/login');
    });
})


//citystate post

//app.post("/citystate", function (req, res) {
//    var city = req.body.city;
//    var state = req.body.state;
//    var country = req.body.country;
//    console.log(city + state + country);
//
//    var options = {
//        "sort": {
//            "gas_empty_date": 1
//        },
//    };
//
//    User.aggregate([{
//        $match: {
//            city: city
//        }
//    }, {
//        $sort: {
//            "gas_empty_date": 1
//        }
//    }, {
//        $group: {
//            _id: "$gas_empty_date",
//            count: {
//                $sum: 1
//            }
//        }
//    }, ]).exec(function (err, doc) {
//        console.log(doc);
//    });
//
//    distributer_table.exec(function (err, data) {
//        if (err) {
//            console.log(err);
//        }
//        distinfo = data;
//        console.log()
//    })
//    user_table.exec(function (err, data) {
//        if (err) {
//            console.log(err);
//        }
//        userinfo = data;
//    })
//    res.render("distributer_dashboard", {
//        distributor_record: distinfo,
//        user_record: userinfo,
//        selected_city: city,
//        contents:city+state+country
//    });
//
//
//
//})
//post request-------------------------------------
app.post("/login_user", function (req, res, next) {

    passport.authenticate('local-user', {
        successRedirect: '/dashboard_user',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next)
});

app.post("/login_distributer", function (req, res, next) {

    passport.authenticate('local-distributer', {
        successRedirect: '/dashboard_distributer',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next)
});
app.post("/register_user", function (req, res) {
    const {
        user_firstname,
        user_lastname,
        user_address,
        user_country,
        user_state,
        user_city,
        user_phoneno,
        user_email,
        user_pass1,
        user_pass2,
        user_gasno,
    } = req.body;

    let errors_user = [];
    //check password
    if (user_pass1 != user_pass2) {
        errors_user.push({
            msg: 'Passwords dont match'
        });
    }
    // check passs length
    if (user_pass1.length < 6) {
        errors_user.push({
            msg: 'Passwords should be alteast 6 characters'
        });
    }
    if (errors_user.length > 0) {
        res.render("register", {
            errors: errors_user,
            user_firstname,
            user_lastname,
            user_address,
            user_country,
            user_state,
            user_city,
            user_phoneno,
            user_email,
            user_pass1,
            user_pass2,
            user_gasno,
            class1: "active",
            class2: ""
        })
    } else {
        User.findOne({
            email: user_email
        }, function (err, founduser) {
            if (founduser) {
                errors_user.push({
                    msg: 'Email is already Registered'
                });
                res.render("register", {
                    errors: errors_user,
                    user_firstname,
                    user_lastname,
                    user_address,
                    user_country,
                    user_state,
                    user_city,
                    user_phoneno,
                    user_email,
                    user_pass1,
                    user_pass2,
                    user_gasno,
                    class1: "active",
                    class2: ""
                })
            } else {
                const newUser = new User({
                    name: {
                        firstname: user_firstname,
                        lastname: user_lastname
                    },
                    address: user_address,
                    country: user_country,
                    state: user_state,
                    city: user_city,
                    phoneno: user_phoneno,
                    email: user_email,
                    password: user_pass1,
                    gasId: user_gasno
                })
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) {
                        throw err;
                    } else {
                        //set password to hashed
                        newUser.password = hash;
                        newUser.save().then(user => {
                            req.flash('success_msg', 'You have Registered Successfully.Please log in!!!');
                            res.redirect("/login");
                        }).catch(err => console.log(err));
                    }
                }))
            }
        })
    }
});

app.post("/register_distributer", function (req, res) {
    const {
        distributer_firstname,
        distributer_lastname,
        distributer_address,
        distributer_country,
        distributer_state,
        distributer_city,
        distributer_phoneno,
        distributer_email,
        distributer_pass1,
        distributer_pass2
    } = req.body;

    let errors_distributer = [];
    //check password
    if (distributer_pass1 != distributer_pass2) {
        errors_distributer.push({
            msg: 'Passwords dont match'
        });
    }
    // check passs length
    if (distributer_pass1.length < 6) {
        errors_distributer.push({
            msg: 'Passwords should be alteast 6 characters'
        });
    }
    if (errors_distributer.length > 0) {
        res.render("register", {
            errors: errors_distributer,
            distributer_firstname,
            distributer_lastname,
            distributer_address,
            distributer_state,
            distributer_city,
            distributer_phoneno,
            distributer_phoneno,
            distributer_email,
            distributer_pass1,
            distributer_pass2,
            class1: "",
            class2: "active"

        })
    } else {
        distributer.findOne({
            email: distributer_email
        }, function (err, found_distributer) {
            if (found_distributer) {
                errors_distributer.push({
                    msg: 'Email is already Registered'
                });
                res.render("register", {
                    errors: errors_distributer,
                    distributer_firstname,
                    distributer_lastname,
                    distributer_address,
                    distributer_state,
                    distributer_city,
                    distributer_phoneno,
                    distributer_phoneno,
                    distributer_email,
                    distributer_pass1,
                    distributer_pass2,
                    class1: "",
                    class2: "active"
                })
            } else {
                const newdistributer = new distributer({
                    name: {
                        firstname: distributer_firstname,
                        lastname: distributer_lastname
                    },
                    address: distributer_address,
                    country: distributer_country,
                    state: distributer_state,
                    city: distributer_city,
                    phoneno: distributer_phoneno,
                    email: distributer_email,
                    password: distributer_pass1,
                })
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newdistributer.password, salt, (err, hash) => {
                    if (err) {
                        throw err;
                    } else {
                        //set password to hashed
                        newdistributer.password = hash;
                        newdistributer.save().then(distributer => {
                            req.flash('success_msg', 'You have Registered Successfully.Please log in!!!');
                            res.redirect("/login");
                        }).catch(err => console.log(err));
                    }
                }))
            }
        });
    }
});


app.listen(PORT, function () {
    console.log('server started on port ' + PORT);
});
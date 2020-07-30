const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//Load User Modal
const User = require("../Modals/user");
const Distributer = require("../Modals/distributer");

function SessionConstructor(userId, userGroup, details) {
    this.userId = userId;
    this.userGroup = userGroup;
    this.details = details;
}


module.exports = function (passport) {
    passport.use('local-user',
        new LocalStrategy({
            usernameField: 'user_email',
            passwordField: 'user_password'
        }, (user_email, user_password, done) => {
            User.findOne({
                    email: user_email
                })
                .then(user => {
                    //mathc user
                    if (!user) {
                        return done(null, false, {
                            message: 'The Email Entered is not registered'
                        });
                    }
                    //mathc password
                    bcrypt.compare(user_password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, {
                                message: 'Password incorrect'
                            });
                        }
                    })

                })
                .catch(err => console.log(err));
        })
    );


    passport.use('local-distributer',
        new LocalStrategy({
            usernameField: 'dis_email',
            passwordField: 'dis_password'
        }, (dis_email, dis_password, done) => {
            Distributer.findOne({
                    email: dis_email
                })
                .then(user => {
                    //mathc user
                    if (!user) {
                        return done(null, false, {
                            message: 'The Email Entered is not registered'
                        });
                    }
                    //mathc password
                    bcrypt.compare(dis_password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, {
                                message: 'Password incorrect'
                            });
                        }
                    })

                })
                .catch(err => console.log(err));
        })
    );

    passport.serializeUser(function (userObject, done) {
    
        let userGroup = "User";
        let userPrototype = Object.getPrototypeOf(userObject);
        if (userPrototype === User.prototype) {
            userGroup = "User";
        } else if (userPrototype === Distributer.prototype) {
            userGroup = "Distributer";
        }

        let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');
        done(null, sessionConstructor);

    });

    passport.deserializeUser(function (sessionConstructor, done) {

        if (sessionConstructor.userGroup == "User") {
            User.findOne({
                _id: sessionConstructor.userId
            }, '-localStrategy.password', function (err, user) { 
                done(err, user);
            });
        } else if (sessionConstructor.userGroup == "Distributer") {
            Distributer.findOne({
                _id: sessionConstructor.userId
            }, '-localStrategy.password', function (err, user) { 
                done(err, user);
            });
        }

    });

}
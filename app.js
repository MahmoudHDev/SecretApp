//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";
// import md5 from 'md5';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import findOrCreate from 'mongoose-findorcreate';

// Properties:-
const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const uri = 'mongodb://127.0.0.1:27017/userDB';
const { Schema } = mongoose;

const userSchema = new Schema({
    email: String,
    password: String
});
// Hash and salt the password and save the user to the db of mongoDB
userSchema.plugin(passportLocalMongoose, {
    // Set usernameUnique to false to avoid a mongodb index on the username column!
    usernameUnique: false,
});
userSchema.plugin(findOrCreate);

const User = mongoose.model('Users', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return done(err, user);
        });
    }
));

// Methods:-
mongoose.connect(uri);
app.set('trust proxy', 1)
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, "public")));
app.use(session({
    secret: 'asdasdasasdasdasd',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

// init passport
app.use(passport.initialize());
// persistent login sessions 
app.use(passport.session());

app.get(('/'), (req, res) => {
    res.render('home');
    console.log(req.isAuthenticated());
});

app.route('/register')
    .get((req, res) => {
        //To view the register page as a result of the get request.
        res.render('register')
    })

    .post((req, res) => {
        const usernameText = req.body.username;
        const passwordText = req.body.password;

        User.register({ username: usernameText }, passwordText, async (err, user) => {
            if (err) {
                console.log("Error has been occured" + err);
                res.redirect('/register');
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/secrets');
                });
            };
        });
    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/login'); // Redirect if login fails
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/secrets'); // Redirect if login succeeds
        });
    })(req, res, next);
});

app.get('/secrets', async (req, res) => {
    if (req.isAuthenticated()) {
        console.log("user is Authenticated");
        res.render('secrets')
    } else {
        console.log("User is not Authenticated");
        res.redirect('/login')
    }
});

app.listen(port, () => {
    console.log("App started Listening");
});

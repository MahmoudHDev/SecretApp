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


// Properties:-
const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const uri = 'mongodb://127.0.0.1:27017/userDB';
const { Schema } = mongoose;


// how many rounds to encrypt my password.
const saltRounds = 10;

const userSchema = new Schema({
    name: String,
    password: String
});

const User = new mongoose.model("Users", userSchema);

// Methods:-
mongoose.connect(uri);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, "public")));

app.get(('/'), (req, res) => {
    res.render('home');
});

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post(async (req, res) => {
        try {
            const userEmail = req.body.username;
            const userPassword = req.body.password;
            const user = await User.findOne({ name: userEmail });

            console.log('User from DB:', user); // Check if user is found in the console

            // Load hash from your password DB.

            if (user) {
                // Perform your actions when the user is found and passwords match
                bcrypt.compare(userPassword, user.password, function (err, result) {
                    if (result == true) {
                        res.status(200).render("secrets");
                    } else {
                        console.log(err);
                        res.status(401).send("Check the username or the password");
                    }
                });

            } else {
                // Handle case when user is not found or passwords don't match
                res.status(401).send("Check the username or the password");
            }
        } catch (error) {
            console.error("Error occurred:", error);
            res.status(400).send("Error occurred");
        }
    });

app.route('/register')
    .get((req, res) => {
        //To view the register page as a result of the get request.
        res.render('register');
    })
    .post((req, res) => {
        try {
            const userEmail = req.body.username;
            const userPassword = req.body.password;
            bcrypt.genSalt(saltRounds, (err, salt) => {
                bcrypt.hash(userPassword, salt, async (err, hash) => {
                    // Store hash in your password DB.
                    if (err) {
                        console.log(err)
                    } else {
                        const userData = new User({
                            name: userEmail,
                            password: hash
                        });
                        await userData.save();
                        res.status(200).render("secrets");
                    }
                });
            });
        } catch (error) {
            res.status(400).send(`Error has been occured ${error}`);
        }
    });

app.listen(port, () => {
    console.log("App started Listening");
});

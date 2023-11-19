import express from "express";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from 'path';
import mongoose from "mongoose";
// Properties:-
const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const uri = 'mongodb://127.0.0.1:27017/Users';
const User = mongoose.model('User', {
    name: String,
    password: String
});

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
    });

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        const userEmail = req.body.username;
        const userPassword = req.body.password;

        const userData = new User({
            name: userEmail,
            password: userPassword
        });
        userData.save().then(() => console.log('Saved'));
    })

app.listen(port, () => {
    console.log("App started Listening");
});
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                name: name,
                password: hashedPassword,
            })
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'New User Created!',
                userId: result._id
            })
        })
        .catch(err => console.log(err));
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let savedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                const error = new Error('Email not found.');
                error.statusCode = 401;
                throw error;
            }
            savedUser = user; //to access user in subsequent then chain promises
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong Password :-o');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: savedUser.email,
                userId: savedUser._id.toString()
            }, 'hashingToken',
                { expiresIn: '1hr' }
            );
            res.status(200).json({
                message: 'JWT created',
                token: token,
                userId: savedUser._id
            })
        })
        .catch(err => {
            console.log(err);
            next(err);
        })
}
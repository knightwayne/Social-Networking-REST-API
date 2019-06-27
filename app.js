const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null,new Date().toISOString() + '-' + file.originalname);
    }
})
const fileFilterF = (req, file, cb) => {
    if ((file.mimetype == 'image/png') || (file.mimetype == 'image/jpg') || (file.mimetype == 'image/jpeg')) {
        // console.log('approved format');
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

//app.use(bodyParser.urlencoded());  //form data
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilterF }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')));
//app.use('/controllers', express.static(path.join(__dirname, 'controllers')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status).json({ message: message });
})

mongoose.connect('mongodb://localhost:27017/network', { useNewUrlParser: true })
    .then(res => {
        console.log('Connected to database');
        const server = app.listen(8080);
        //const io = require('socket.io')(server);
        const io = require('./socket').init(server);
        io.on('connection', socket=>{
            console.log('Client Connected!');
        })
    })
    .catch(err => {
        console.log(err);
    })
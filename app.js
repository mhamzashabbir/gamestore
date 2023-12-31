const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const mongoose = require('mongoose');
const User = require('./models/user');

const app = express();

const store = new MongoDbStore({
    uri : 'mongodb+srv://muhammadhamzapro007:Games321@cluster0.biejosy.mongodb.net/shop',
    collection : 'sessions'
})

const csrfProtection = csrf();
const fileStrorage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, 'images');
    },
    filename : (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

const file_Filter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg'  || file.mimetype === 'image/jpeg'){
        cb(null, true);
    }
    else{
        cb(null, false);
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage : fileStrorage, fileFilter: file_Filter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images' , express.static(path.join(__dirname, 'images')));
app.use(session({
    secret : 'my secret',
    resave : false,
    saveUninitialized : false,
    store : store}));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAdmin = req.session.isAdmin;
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use((req, res, next) => {
    //throw new Error('Sync Dummy');
    if (!req.session.user){
        return next();
    }
    User.findById(req.session.user._id).then(
        user => {
            if (!user){
                return next();
            }
            req.user = user;
            next();
        }
    ).catch(err => {
        next(new Error(err));
    });
})


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500)
        .render('500', { 
            pageTitle: 'An Error Occurred',
            path: '/500'
        });
})


mongoose.connect('mongodb+srv://muhammadhamzapro007:Games321@cluster0.biejosy.mongodb.net/shop?retryWrites=true&w=majority')
    .then(result => {
        console.log('Connected!');
        app.listen(3000);
    })
    .catch(err => console.log(err));

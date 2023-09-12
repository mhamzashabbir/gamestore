const express = require('express');
const expValidator = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.post('/login', 
[
    expValidator.body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),

    expValidator.body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric()
]
, authController.postLogin);


router.post('/signup', 
[ 
    expValidator.check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, {req}) => {
        return User.findOne({email: value})
        .then(userDoc => {
          if(userDoc){
            return Promise.reject('E-mail exists already, please pick a different one.')
           }
        })
    })
    .normalizeEmail(),

    expValidator.body(
        'password',
        'Please enter a password with only numbers and text and at least 5 characters.'
    )
    .isLength({min : 5}),

    expValidator.body('confirmPassword').custom((value, {req}) => {
        if (value !== req.body.password){
            throw new Error('Passwords have to match!');
        }
        return true;
    })
] 
, authController.postSignup);
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
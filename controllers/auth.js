const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const expValidator = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testeracctest01@gmail.com',
    pass: 'cxjficmvstssabol', //Hamza000
  },
});

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  let success = req.flash('success');
  if (message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  if (success.length > 0){
    success = success[0];
  }else{
    success = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    successMessage: success,
    oldInput : {email : '', password : ''},
    validationErrors : []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput : {email : '', password : '', confirmPassword : ''},
    validationErrors : []
  });
};

exports.postLogin = (req, res, next) => {
  email = req.body.email;
  password = req.body.password;
  const errors = expValidator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      successMessage : null,
      oldInput : {email : email, password : password},
      validationErrors : errors.array()
    });
  }

  User.findOne({email : email})
    .then(user => {
      if (!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          successMessage : null,
          oldInput : {email : email, password : password},
          validationErrors : [{path : 'email' , path : 'password'}]
        });
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch){
            req.session.isLoggedIn = true;
            if (email === 'tgmrcr@gmail.com'){
              req.session.isAdmin = true;
            }
            else{
              req.session.isAdmin = false;
            }
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            })
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            successMessage : null,
            oldInput : {email : email, password : password},
            validationErrors : [{path : 'email' , path : 'password'}]
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });   
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = expValidator.validationResult(req);
  if (!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput : {email : email, password : password, confirmPassword : confirmPassword},
      validationErrors : errors.array()
    });
  }
  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword, 
        cart: {items: []}
      });
      return user.save();
    })
    .then(result => {
      req.flash('success', 'Account Created Successfully.');
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'testeracctest01@gmail.com',
        subject: 'Signup succeeded!',
        html: '<h1>You successfully signed up!</h1>'
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });   
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  })
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  let success = req.flash('success');
  if (message.length > 0){
    message = message[0];
  }else{
    message = null;
  }
  if (success.length > 0){
    success = success[0];
  }else{
    success = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
    successMessage: success
  });
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email : req.body.email})
      .then(user => {
        if (!user){
          req.flash('error', 'No account found associated with that email.');        
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        return user.save()
        .then(result => {
          req.flash('success', 'Reset link sent to email.');
          res.redirect('/reset');
          transporter.sendMail({
            to: req.body.email,
            from: 'testeracctest01@gmail.com',
            subject: 'Password reset',
            html: `
              <h1>You requested a password reset</h1>
              <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password.</p>
            `
          })
        })
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });   
  });
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken : token, resetTokenExpiration : {$gt : Date.now()}})
    .then(user => {
      let message = req.flash('error');
      let success = req.flash('success');
      if (message.length > 0){
        message = message[0];
      }else{
        message = null;
      }
      if (success.length > 0){
        success = success[0];
      }else{
        success = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        successMessage: success,
        userId : user._id.toString(),
        passwordToken : token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });   
}

exports.postNewPassword = (req, res, next) => {
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  if (password !== confirmPassword){
    req.flash('error', 'Passwords do not match.');
    return res.redirect(`/reset/${passwordToken}`);
  }
  User.findOne({resetToken : passwordToken, resetTokenExpiration : {$gt : Date.now()}, _id : userId})
    .then(user => {
      resetUser = user;
      return bcrypt.hash(password, 12)
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save()
    })
    .then(result => {
      req.flash('success', 'Password reset successfully.');
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });   
}
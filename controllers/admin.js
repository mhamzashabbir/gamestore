const expValidator = require('express-validator');
const mongoose = require('mongoose');

const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing : false,
    hasError : false,
    errorMessage : null,
    validationErrors : []
  });
};

exports.postAddProduct = (req, res, next) => {

  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing : false,
      hasError : true,
      product : {
        title : title,
        price : price,
        description : description
      },
      errorMessage : 'Attached file is not an image. Please upload .png, .jpg or .jpeg file.',
      validationErrors : []
    })
  }

  const errors = expValidator.validationResult(req);
  console.log(errors.array());

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing : false,
      hasError : true,
      product : {
        title : title,
        price : price,
        description : description
      },
      errorMessage : errors.array()[0].msg,
      validationErrors : errors.array()
    })
  }

  const imageUrl = image.path;

  const product = new Product({
    //_id : new mongoose.Types.ObjectId('64e525b0b398f5fbd76bada5'), // to create a duplicate id to check error handling
    title : title,
    price : price,
    description : description,
    imageUrl : imageUrl,
    userId : req.user
  });
  product
  .save()
  .then(result => {
    console.log('Product Created');
    res.redirect('/admin/products');
  })
  .catch(err => {

    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);

    //res.redirect('/500');

    // return res.status(500).render('admin/edit-product', {
    //   pageTitle: 'Add Product',
    //   path: '/admin/add-product',
    //   editing : false,
    //   hasError : true,
    //   product : {
    //     title : title,
    //     imageUrl : imageUrl,
    //     price : price,
    //     description : description
    //   },
    //   errorMessage : "Database operation failed, Please try again.",
    //   validationErrors : []
    // })
  })
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (editMode !== "true"){
    res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
  // Product.findByPk(prodId)
    .then(product => {
      if(!product){
        res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing : editMode,
        product : product,
        hasError : false,
        errorMessage : null,
        validationErrors : []
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });   
};


exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = expValidator.validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing : true,
      hasError : true,
      product : {
        title : updatedTitle,
        price : updatedPrice,
        description : updatedDescription,
        _id : prodId
      },
      errorMessage : errors.array()[0].msg,
      validationErrors : errors.array()
    })
  }

  Product.findById(prodId)
  .then(product => {
    if (product.userId.toString() !== req.user._id.toString()){
      return res.redirect('/');
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDescription;
    if (image){
      fileHelper.deletefile(product.imageUrl);
      product.imageUrl = image.path;
    }
    return product.save()    
      .then(result => {
        console.log('Product Updated');
        res.redirect('/admin/products');
      })
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });   
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product){
        return next(new Error('Product not found'));
      }
      fileHelper.deletefile(product.imageUrl);
      return Product.deleteOne({_id : prodId, userId : req.user._id})
    })
    .then(() => {
      res.status(200).json({message : 'Success!.'});
    })
    .catch(err => {
      res.status(500).json({message : 'Deleting Product Failed.'});
    });   



};


exports.getProducts = (req, res, next) => {
  Product.find({userId : req.user._id})
  // .select('title price -_id') // to select specific fields
  // .populate('userId', 'name') // to populate the user data
  .then(products => {
    console.log(products);
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    })
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });   
};

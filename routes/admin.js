const path = require('path');

const express = require('express');
const expValidator = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, isAdmin,  adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, isAdmin,  adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', 
[
    expValidator.body('title' , 'Please enter a valid title').isString().isLength({min : 3}).trim(),
    //expValidator.body('imageUrl' , 'Please enter a valid URL').isURL(),
    expValidator.body('price' , 'Please enter a valid price').isFloat(),
    expValidator.body('description' , 'Please enter a valid description having length range of 5 to 250 characters').isLength({min : 5, max : 250}).trim()

] , isAuth, isAdmin ,  adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, isAdmin, adminController.getEditProduct);

router.post('/edit-product', 
[
    expValidator.body('title' , 'Please enter a valid title').isString().isLength({min : 3}).trim(),
    // expValidator.body('imageUrl' , 'Please enter a valid URL').isURL(),
    expValidator.body('price' , 'Please enter a valid price').isFloat(),
    expValidator.body('description' , 'Please enter a valid description having length range of 5 to 250 characters').isLength({min : 5, max : 250}).trim()

] , isAuth,  isAdmin, adminController.postEditProduct);

router.delete('/product/:productId', isAuth,  isAdmin,  adminController.deleteProduct);

module.exports = router;

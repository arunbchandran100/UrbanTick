const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");


// Admin login page
router.get("/login",adminController.getLogin);
router.post("/login", adminController.postLogin);

// Logout admin
router.post("/logout", adminController.logout);

// Admin dashboard
router.get("/dashboard",  adminController.getDashboard);


// Admin  Customers
router.get("/customers", adminController.getCustomers);
router.post("/customers/unblock/:id", adminController.unblockCustomer);
router.post("/customers/block/:id", adminController.blockCustomer);
router.post("/customers/updateStatus/:id", adminController.updateStatus);


// Category Routes
router.get("/category", adminController.getCategories);
router.post("/category/add", adminController.addCategory);
router.post("/category/update/:id", adminController.updateCategory);
router.post("/category/delete/:id", adminController.deleteCategory);


// product Routes
const adminProduct = require("../controllers/admin/adminProductController");


router.get("/products", adminProduct.getProducts);
router.get("/products/add", adminProduct.getAddProduct);
router.post("/products/add", adminProduct.postAddProduct);
router.post("/products/update/:id", adminProduct.updateProduct);
router.post("/products/delete/:id", adminProduct.deleteProduct);

router.post("/variants/add", adminProduct.addVariant);
router.post("/variants/update/:id", adminProduct.updateVariant);
router.post("/variants/delete/:id", adminProduct.deleteVariant);



module.exports = router;




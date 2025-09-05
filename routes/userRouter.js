const express = require('express');
const userRouter = express.Router();
const {getHome} = require('../controllers/userController');

userRouter.get('/', getHome);

module.exports = userRouter;
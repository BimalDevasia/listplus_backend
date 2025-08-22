const express = require('express')
const router = express.Router() 
const {getUserByBatch} = require("../controllers/userController")


router.post('/', getUserByBatch)

module.exports = router
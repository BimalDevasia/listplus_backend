const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const { initializeFirebase } = require('./config/firebase');
require('dotenv').config();

initializeFirebase();

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());



app.get("/",(req,res)=>{
    res.json({
        message:"Welcome to list plus",
        status:"success"
    });
})

//routes import 
const authRoute = require('./routes/auth');
const listRoute = require('./routes/list');
const userRoute = require('./routes/user');
const listItemsRoute = require('./routes/listItems');
const groupRoute = require('./routes/group');
const groupItemsRoute = require('./routes/groupItems');
const shopRoute = require('./routes/shop');
const shopItemsRoute = require('./routes/shopItems');

//routes
app.use("/api/auth", authRoute);
app.use("/api/list", listRoute);
app.use("/api/user", userRoute);
app.use("/api/listitems", listItemsRoute);
app.use("/api/group", groupRoute);
app.use("/api/groupitems", groupItemsRoute);
app.use("/api/shop", shopRoute);
app.use("/api/shopitems", shopItemsRoute);

app.get("/health",(req,res)=>{
    res.json({
        status:"OK",
        Timestamp: new Date().toISOString()
    });
})

app.use((req,res)=>{
    res.status(404).json({
        error:"Route Not Found"
    })
})

app.use((err,req,res,next)=>{
    console.error("Error occurred:", err);
    res.status(500).json({
        error:process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
})

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
})

module.exports = app;
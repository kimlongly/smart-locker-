const dotenv = require('dotenv');
const express = require("express");
const app = express();
const mongo = require('./database');


//import authorization routes 
const authroute = require('./routes/userAuth');
const booking_route = require('./booking');
const date_increment = require('./date_addition')
//test module:
const db_router = require('./test_database');
app.use('/',db_router);


//middle ware 
app.use(express.json());
// middle ware from user auth
app.use('/api/user',authroute);
app.use('/',booking_route);
app.use('/',date_increment);

app.listen(process.env.PORT || 5000);

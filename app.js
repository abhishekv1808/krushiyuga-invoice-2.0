const express = require('express');
const path =require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const rootDir = require('./utils/mainUtils');
const mongoose =require('mongoose');
const mongoDBURL = 'mongodb+srv://abhishekv1808:' + encodeURIComponent('Grow@$@2025') + '@aribnb.xvmlcnz.mongodb.net/practise-invoice?retryWrites=true&w=majority&appName=aribnb';
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const authRouter = require('./routes/authRouter');

const app = express();

// Session store configuration
const store = new MongoDBStore({
    uri: mongoDBURL,
    collection: 'sessions'
});

app.set('view engine' ,'ejs' );
app.set('views', 'views');

app.use(express.static(path.join(rootDir, "public")));
app.use(express.urlencoded({extended: true}));
app.use(express.json()); // Add JSON body parser for API requests

// Session configuration
app.use(session({
    secret: 'krushiyuga-admin-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));


app.use(userRouter);
app.use(adminRouter);
app.use(authRouter);

const port = 3000;

mongoose.connect(mongoDBURL).then(()=>{
    console.log("connected to Mongodb");
    app.listen(port, ()=>{
        console.log(`Server is running on port  : http://localhost:${port}`)
    })
})





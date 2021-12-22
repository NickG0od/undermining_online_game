const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const exphbs = require('express-handlebars')
const Handlebars  = require('handlebars')
const cookieParser = require('cookie-parser')

const mainRoute = require('./routes/main')

const PORT = process.env.PORT || 3000
const mongoDB = 'mongodb+srv://admin:XkNWMUxX57LNp184@cluster0.cechz.mongodb.net/undermining?retryWrites=true&w=majority';


const app = express()
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

app.use(cookieParser())
app.use(express.urlencoded({ extended:true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use(mainRoute)

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

async function start() {
    try {
        await mongoose.connect(mongoDB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })

        app.listen(PORT, () => {
            console.log(`\n[!] Server has been started at port ${PORT}...`)
        });
    } catch (e) {
        console.log(e);
    }
}

start();

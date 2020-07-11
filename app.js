const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const exphbs = require('express-handlebars')

const mainRoute = require('./routes/map')

const PORT = process.env.PORT || 3000
const mongoDB = 'mongodb+srv://freequx:1f2r3e4e@cluster0.gwkxc.gcp.mongodb.net/products'


const app = express()
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.urlencoded({ extended:true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use(mainRoute)

async function start() {
    try {
        await mongoose.connect(mongoDB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })

        app.listen(PORT, () => {
            console.log("\n[!] Server has been started...")
        });
    } catch (e) {
        console.log(e);
    }
}

start();

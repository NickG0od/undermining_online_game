const {Router} = require('express')
const router = Router()

const Product = require('../models/Product')
const { mongo } = require('mongoose')
const fs = require('fs')


router.get('/', async (req, res) => {
    const products = await Product.find({}).lean()

    let dataMap = {
        type: "FeatureCollection",
        features: []
    }
    for (let i=0; i<products.length; i++) {
        let elemMap = {
            type: "Feature",
            id: i,
            geometry: {
                type: "Point",
                coordinates: products[i].coordinates,
            },
            properties: {
                balloonContentBody: `<p>Название продукта: ${products[i].title} <p>`,
                balloonContentFooter: `<p>Регион продукта: ${products[i].region} <p>`,
                hintContent: `<strong>Это - ${products[i].title}</strong>`              
            }
        }
        dataMap.features.push(elemMap);
    }

    try {
        let wStream = fs.createWriteStream("public/file.json");
        wStream.write(JSON.stringify(dataMap) + "\r\n");
        wStream.end();
    } catch (err) {
        console.log(err.message);
    }

    res.render('index', {
        title: 'MAPPO',
        isIndex: true
    })
})

router.get('/products_show', async (req, res) => {
    const products = await Product.find({}).lean()
    res.render('products_show', {
        title: 'Список продуктов',
        isProductsShow: true,
        products
    })
})

router.post('/product_create', async (req, res) => {
    const product = Product({
        title: req.body.title,
        region: req.body.region,
        cook_type: req.body.cook_type,
        coordinates: [55, 35]
    })

    await product.save()
    res.redirect('/products_show')
})

router.post('/product_delete', async (req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)

    for (const id of checkers) {
        try {
            await Product.deleteOne({ _id : new mongo.ObjectID(id)});
        } catch (e) {console.log(e);}
    }
    res.redirect('/products_show')
})

router.post('/product_edit', async (req, res) => {
    const newvalues = { $set: {coordinates: req.body['coordinates'], address: "Canyon 123" } };
    try {
        await Product.updateOne({ _id : new mongo.ObjectID(req.body['id'])}, newvalues);
    } catch (e) {console.log(e);}

    res.redirect('/products_show')
})

module.exports = router
const {Router} = require('express')
const router = Router()

const Product = require('../models/Product')
const { mongo } = require('mongoose')
const fs = require('fs')
const JSONStream = require('JSONStream')
const utils = require('../utils')


router.get('/', async (req, res) => {
    const products = await Product.find({}).lean()

    let dataMapProducts = {
        type: "FeatureCollection",
        features: []
    }
    let dataMapDishes = {
        type: "FeatureCollection",
        features: []
    }
    let dataMapAll = {
        type: "FeatureCollection",
        features: []
    }

    for (let i=0; i<products.length; i++) {
        if (products[i].type == "product") {
            let elemMap = {
                type: "Feature",
                id: i,
                geometry: {
                    type: "Point",
                    coordinates: products[i].coordinates,
                },
                options: {
                    iconLayout: "default#image",
                    iconImageHref: `${products[i].icon_path}`,
                    iconImageSize: [24, 24],
                    iconImageOffset: [0, 0]
                },
                properties: {
                    balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].type}</p>`,
                    balloonContentFooter: `<p>Регион продукта: ${products[i].region}</p>`,
                    clusterCaption: `<p>Я - ${products[i].title}</p>`,
                    hintContent: `<strong>Это - ${products[i].title}</strong>`              
                }
            }
            dataMapProducts.features.push(elemMap)
        }
        if (products[i].type == "dish") {
            let elemMap = {
                type: "Feature",
                id: i,
                geometry: {
                    type: "Point",
                    coordinates: products[i].coordinates,
                },
                options: {
                    iconLayout: "default#image",
                    iconImageHref: `${products[i].icon_path}`,
                    iconImageSize: [24, 24],
                    iconImageOffset: [0, 0]
                },
                properties: {
                    balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].type}</p>`,
                    balloonContentFooter: `<p>Регион продукта: ${products[i].region}</p>`,
                    clusterCaption: `<p>Я - ${products[i].title}</p>`,
                    hintContent: `<strong>Это - ${products[i].title}</strong>`              
                }
            }
            dataMapDishes.features.push(elemMap)
        }

        let elemMap = {
            type: "Feature",
            id: i,
            geometry: {
                type: "Point",
                coordinates: products[i].coordinates,
            },
            options: {
                iconLayout: "default#image",
                iconImageHref: `${products[i].icon_path}`,
                iconImageSize: [24, 24],
                iconImageOffset: [0, 0]
            },
            properties: {
                balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].type}</p>`,
                balloonContentFooter: `<p>Регион продукта: ${products[i].region}</p>`,
                clusterCaption: `<p>Я - ${products[i].title}</p>`,
                hintContent: `<strong>Это - ${products[i].title}</strong>`              
            }
        }
        dataMapAll.features.push(elemMap)
    }

    try {
        let wStream = fs.createWriteStream("public/data/dataMapProducts.json")
        wStream.write(JSON.stringify(dataMapProducts) + "\r\n")
        wStream.end()

        wStream = fs.createWriteStream("public/data/dataMapDishes.json")
        wStream.write(JSON.stringify(dataMapDishes) + "\r\n")
        wStream.end()

        wStream = fs.createWriteStream("public/data/dataMapAll.json")
        wStream.write(JSON.stringify(dataMapAll) + "\r\n")
        wStream.end()
    } catch (err) {
        console.log(err.message)
    }

    res.render('index', {
        title: 'MAPPO',
        isIndex: true
    })
})

router.get('/products_show', async (req, res) => {
    const products = await Product.find({}).lean()

    const GetDataIcons = () => {
        return new Promise((resolve, reject) => {
            let fetchedData = {}
            fs.createReadStream("public/data/dataIcons.json")
                .pipe(JSONStream.parse('*'))
                .on('data', (data) => {
                    fetchedData = data
                    for (let i = 0; i<fetchedData.length; i++) {
                        fetchedData[i]['id'] = fetchedData[i]['path'].replace("/icons/", '').replace(".png", '')
                    }
                    resolve(fetchedData)
                })
                .on('error', reject)
        })
    }
    const dataIcons = await GetDataIcons()

    res.render('products_show', {
        title: 'Список продуктов',
        isProductsShow: true,
        products,
        dataIcons
    })
})

router.post('/product_create', async (req, res) => {
    const product = Product({
        type: req.body.type,
        title: req.body.title,
        icon_path: req.body.icon_path,
        coordinates: [55, 35],
        region: req.body.region,
        description: req.body.description
    })

    await product.save()
    res.redirect('/products_show')
})

router.post('/product_delete', async (req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)

    for (const id of checkers) {
        try {
            await Product.deleteOne({ _id : new mongo.ObjectID(id)})
        } catch (e) {console.log(e)}
    }
    res.redirect('/products_show')
})

router.post('/product_edit', async (req, res) => {
    let newValues = {}
    if (req.body['title'] != "" && req.body['description'] != "") {
        newValues = { $set: {coordinates: req.body['coordinates'], region: req.body['region'], title: req.body['title'], description: req.body['description']} }
    } else if (req.body['title'] != "" && req.body['description'] == "") {
        newValues = { $set: {coordinates: req.body['coordinates'], region: req.body['region'], title: req.body['title']} }
    } else if (req.body['title'] == "" && req.body['description'] != "") {
        newValues = { $set: {coordinates: req.body['coordinates'], region: req.body['region'], description: req.body['description']} }
    } else if (req.body['title'] == "" && req.body['description'] == "") {
        newValues = { $set: {coordinates: req.body['coordinates'], region: req.body['region']} }
    }
    
    try {
        await Product.updateOne({ _id : new mongo.ObjectID(req.body['id'])}, newValues)
    } catch (e) {console.log(e)}

    res.redirect('/products_show')
})

module.exports = router
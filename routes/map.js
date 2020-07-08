const {Router} = require('express')
const router = Router()

const Product = require('../models/Product')
const { mongo } = require('mongoose')
const fs = require('fs')
const JSONStream = require('JSONStream')
const utils = require('../utils')
const path = require('path'); 
const multer = require('multer'); 


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname+'-'+Date.now()+'.png')
    }
})
const upload = multer({storage: storage})

router.get('/', async (req, res) => {
    const products = await Product.find({}).lean()

    const arrayTypes = ["product", "dish", "wild_plant", "fish", "all"]
    let dataMap = {}
    arrayTypes.forEach(elem => {
        dataMap[`${elem}`] = {
            type: "FeatureCollection",
            features: []
        }
    }) 

    for (let i=0; i<products.length; i++) {
        let elemOfMap = {
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
                balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].typeRU}</p>`,
                balloonContentFooter: `<p>Регион продукта: ${products[i].region}</p>`,
                clusterCaption: `<p>Я - ${products[i].title}</p>`,
                hintContent: `<strong>Это - ${products[i].title}</strong>`              
            }
        }
        arrayTypes.forEach(elem => {
            if (products[i].type == elem && elem != "all") {
                dataMap[elem].features.push(elemOfMap)
            }
        })
        dataMap["all"].features.push(elemOfMap)

        try {
            if (products[i].img.data) {
                products[i].img.dataStr = products[i].img.data.toString('base64')
            }
        } catch (e) {products[i].img = {
            data: "",
            contentType: 'null',
            dataStr: ""
        }}
    }

    try {
        arrayTypes.forEach(elem => {
            let wStream = fs.createWriteStream(`public/data/dataMap_${elem}.json`)
            wStream.write(JSON.stringify(dataMap[elem]) + "\r\n")
            wStream.end()
        })
    } catch (err) {
        console.log(err.message)
    }

    res.render('index', {
        title: 'MAPPO',
        isIndex: true,
        products
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

router.post('/product_create', upload.single('image'), async (req, res) => {
    let img = {
        data: "",
        contentType: 'null'
    }

    try {
        img.data = fs.readFileSync(`public/uploads/${req.file.filename}`)
        img.contentType = 'image/png'
    } catch (e) {}

    const product = Product({
        type: req.body.type,
        typeRU: utils.getTypeById("ru", req.body.type),
        title: req.body.title,
        icon_path: req.body.icon_path,
        coordinates: [55, 35],
        region: req.body.region,
        description: req.body.description,
        img: img
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
    
    if (req.body['coordinates'][0] != 0 && req.body['coordinates'][1] != 0) {
        newValues['coordinates'] = req.body['coordinates']
        newValues['region'] = req.body['region']
    }
    if (req.body['title'] != "") { newValues['title'] = req.body['title'] }
    if (req.body['description'] != "") {  newValues['description'] = req.body['description'] }

    try {
        await Product.updateOne({ _id : new mongo.ObjectID(req.body['id'])}, {$set: newValues})
    } catch (e) {console.log(e)}

    res.redirect('/products_show')
})

module.exports = router
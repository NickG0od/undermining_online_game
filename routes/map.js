const {Router} = require('express')
const router = Router()

const Product = require('../models/Product')
const Cuisine = require('../models/Cuisine')
const Partner = require('../models/Partner')
const Restaurant = require('../models/Restaurant')
const { mongo } = require('mongoose')
const fs = require('fs')
const utils = require('../utils')
const multer = require('multer'); 
const { count } = require('console')


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
    const cuisines = await Cuisine.find({}).lean()
    const partners = await Partner.find({}).lean()
    const restaurants = await Restaurant.find({}).lean()

    let dataPartners = []
    if (partners.length) {
        for (let i=0; i<partners.length; i++) {
            dataPartners.push(partners[i].iso3166)
            try {
                if (partners[i].img.data) {
                    partners[i].img.dataStr = partners[i].img.data.toString('base64')
                }
            } catch (e) { partners[i].img = {
                data: "",
                contentType: 'null',
                dataStr: ""
            }}
        }
    }

    let dataColorRegs = {}
    if (cuisines.length) {
        for (let i=0; i<cuisines.length; i++) {
            for (let j=0; j<cuisines[i].regions.length; j++) {
                let elem = {
                    color: cuisines[i].color,
                    types: []
                }
                dataColorRegs[ cuisines[i].regions[j].iso3166 ] = elem
            } 
        }
    }

    const arrayTypes = ["product", "dish", "wild_plant", "fish", "all"]
    let dataMap = {}
    arrayTypes.forEach(elem => {
        dataMap[`${elem}`] = {
            type: "FeatureCollection",
            features: []
        }
    })
    let id_num = 0;
    for (let i=0; i<products.length; i++) {
        try {
            if (products[i].img.data) {
                products[i].img.dataStr = products[i].img.data.toString('base64')
            }
        } catch (e) { products[i].img = {
            data: "",
            contentType: 'null',
            dataStr: ""
        }}

        let elemOfMap = null;
        if (typeof products[i].regions[0].coordinates !== 'undefined' && products[i].regions[0].coordinates.length > 0) {
            id_num ++;
            elemOfMap = {
                type: "Feature",
                id: id_num,
                id_glob: products[i]._id,
                iso3166: products[i].regions[0].iso3166,
                geometry: {
                    type: "Point",
                    coordinates: products[i].regions[0].coordinates,
                },
                options: {
                    iconLayout: "default#image",
                    iconImageHref: `${products[i].icon_path}`,
                    iconImageSize: [24, 24],
                    iconImageOffset: [-12, -12]
                },
                properties: {
                    balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].typeRU}</p><img src="data:image/${products[i].img.contentType}; base64, ${products[i].img.dataStr}" style="max-width: 70px;" onerror="this.src = 'images/default.png'; this.onerror = null;"> <p>${products[i].description}</p>`,
                    balloonContentFooter: `<p>Регион: ${products[i].regions[0].title}</p>`,
                    clusterCaption: `<p>- ${products[i].title}</p>`,
                    hintContent: `<strong>${products[i].title}</strong>`              
                }
            }
        }
        
        let dataFromRestaurants = [];
        try {
            products[i].restaurants.forEach(elem => {
                try {
                    restaurants.forEach(restaurant => {
                        if (elem == restaurant._id) {
                            id_num ++;
                            dataFromRestaurants.push (
                                {
                                    type: "Feature",
                                    id: id_num,
                                    id_glob: restaurant._id,
                                    iso3166: restaurant.region.iso3166,
                                    geometry: {
                                        type: "Point",
                                        coordinates: restaurant.region.coordinates,
                                    },
                                    options: {
                                        iconLayout: "default#image",
                                        iconImageHref: `${products[i].icon_path}`,
                                        iconImageSize: [24, 24],
                                        iconImageOffset: [-12, -12]
                                    },
                                    properties: {
                                        balloonContentBody: `<p>Название: ${products[i].title}</p><p>Тип: ${products[i].typeRU}</p><img src="data:image/${products[i].img.contentType}; base64, ${products[i].img.dataStr}" style="max-width: 70px;" onerror="this.src = 'images/default.png'; this.onerror = null;"> <p>${products[i].description}</p><p>Готовится в ресторане:<a class="restaurant-open-modal" id=${restaurant._id} data-toggle="modal" data-target="#showRestaurantModal">${restaurant.title}</a></p>`,
                                        balloonContentFooter: `<p>Регион: ${restaurant.region.title}</p>`,
                                        clusterCaption: `<p>- ${products[i].title}</p>`,
                                        hintContent: `<strong>${products[i].title}</strong>`              
                                    }
                                }
                            )
                        }
                    })
                } catch (e) {console.log(e)}
            })
        } catch(e) {console.log(e)}

        arrayTypes.forEach(elem => {
            if (products[i].type == elem && elem != "all") {
                if (elemOfMap != null) {dataMap[elem].features.push(elemOfMap)}
                try {
                    dataFromRestaurants.forEach(restaurant => {
                        dataMap[elem].features.push(restaurant)
                    })
                } catch(e) {console.log(e)}
            }
        })
        if (elemOfMap != null) {dataMap["all"].features.push(elemOfMap)}
        try {
            dataFromRestaurants.forEach(restaurant => {
                dataMap["all"].features.push(restaurant)
            })
        } catch(e) {console.log(e)}


        if (dataColorRegs[ products[i].regions[0].iso3166 ]) {
            if (dataColorRegs[ products[i].regions[0].iso3166 ]['types'].indexOf( products[i].type ) == -1) {
                dataColorRegs[ products[i].regions[0].iso3166 ]['types'].push( products[i].type )
            }
        }
    }

    let dataColors = {}
    arrayTypes.forEach(elem => {
        dataColors[`${elem}`] = {}

        for (prop in dataColorRegs) {
            if (dataColorRegs[prop]['types'].indexOf(elem) != -1 && elem != "all") {
                dataColors[elem][prop] = dataColorRegs[prop]['color']
            }
            if (dataColorRegs[prop]['types'].length && elem == "all") {
                dataColors["all"][prop] = dataColorRegs[prop]['color']
            }
        }
    })
    try {
        arrayTypes.forEach(elem => {
            let wStream = fs.createWriteStream(`public/data/dynamic/dataMap_${elem}.json`)
            wStream.write(JSON.stringify(dataMap[elem]) + "\r\n")
            wStream.end()

            wStream = fs.createWriteStream(`public/data/dynamic/dataRegColors_${elem}.json`)
            wStream.write(JSON.stringify(dataColors[elem]) + "\r\n")
            wStream.end()
        })
    } catch (err) {
        console.log(err.message)
    }

    res.render('index', {
        title: 'MAPPO Карта',
        isIndex: true,
        products,
        partners,
        dataRegPartners: encodeURIComponent(JSON.stringify(dataPartners))
    })
})

router.get('/objects_editor', async (req, res) => {
    const products = await Product.find({}).lean()
    const restaurants = await Restaurant.find({}).lean()
    const dataIcons = await utils.getDataIcons()
    const dataISO3166 = await utils.getDataISO3166()
    
    res.render('objects_editor', {
        title: 'Редактор "Объекты"',
        isObjectsEditor: true,
        products,
        dataIcons,
        restaurants,
        dataCodeRegs: encodeURIComponent(JSON.stringify(dataISO3166)),
    })
})

router.get('/cuisines_editor', async (req, res) => {
    const cuisines = await Cuisine.find({}).lean()
    let dataRegs = await utils.getDataISO3166()
    if (cuisines.length) {
        for (let i=0; i<cuisines.length; i++) {
            let regs = cuisines[i].regions;
            for (let j=0; j<regs.length; j++) {
                dataRegs = dataRegs.filter(function(el) {
                    if (el['iso3166'] == regs[j]['iso3166']) {return false;}
                    else {return true;}
                })
            }
        }
    }

    res.render('cuisines_editor', {
        title: 'Редактор "Кухни"',
        isCuisinesEditor: true,
        cuisines,
        dataRegs
    })
})

router.get('/partners_editor', async (req, res) => {
    const partners = await Partner.find({}).lean()
    let dataRegs = await utils.getDataISO3166()
        

    if (partners.length) {
        for (let i=0; i<partners.length; i++) {
            let code = partners[i].iso3166
            dataRegs = dataRegs.filter(function(el) {
                if (el['iso3166'] == code) {return false;}
                else {return true;}
            })

            try {
                if (partners[i].img.data) {
                    partners[i].img.dataStr = partners[i].img.data.toString('base64')
                }
            } catch (e) { partners[i].img = {
                data: "",
                contentType: 'null',
                dataStr: ""
            }}
        }
    }

    res.render('partners_editor', {
        title: 'Редактор "Участники"',
        isPartnersEditor: true,
        partners,
        dataRegs
    })
})


router.post('/obj_create', upload.single('image'), async (req, res) => {
    let img = {
        data: "",
        contentType: 'null',
    }
    try {
        img.data = fs.readFileSync(`public/uploads/${req.file.filename}`)
        img.contentType = 'image/png'
    } catch (e) {}

    let restaurants = Array.isArray(req.body.restaurants) ? req.body.restaurants : Array.of(req.body.restaurants)
 
    const product = Product({
        type: req.body.type,
        typeRU: utils.getTypeById("ru", req.body.type),
        title: req.body.title,
        icon_path: req.body.icon_path,
        regions: [
            {
                title: req.body.region,
                coordinates: [],
                iso3166: "",
            }
        ],
        restaurants : restaurants,
        description: req.body.description,
        img: img
    })
    await product.save()
    res.redirect('/objects_editor')
})

router.post('/obj_delete', async (req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)
    for (const id of checkers) {
        try {
            await Product.deleteOne({ _id : new mongo.ObjectID(id)})
        } catch (e) {console.log(e)}
    }
    res.redirect('/objects_editor')
})

router.post('/obj_edit', async (req, res) => {
    let newValues = {}
    if (req.body['regions'][0]['coordinates'][0] != 0 && req.body['regions'][0]['coordinates'][1] != 0) {
        newValues['regions'] = [{}]

        newValues['regions'][0]['title'] = req.body['regions'][0]['title']
        newValues['regions'][0]['coordinates'] = req.body['regions'][0]['coordinates']
        newValues['regions'][0]['iso3166'] = req.body['regions'][0]['iso3166']
    }
    if (req.body['title'] != "") { newValues['title'] = req.body['title'] }
    if (req.body['description'] != "") {  newValues['description'] = req.body['description'] }

    try {
        await Product.updateOne({ _id : new mongo.ObjectID(req.body['id'])}, {$set: newValues})
    } catch (e) {console.log(e)}
    res.redirect('/objects_editor')
})

router.post('/restaurant_create', async(req, res) => {
    const splitted = req.body.region.split(':')
    let coordsStr = splitted[1].split(',')
    const coords = [parseFloat(coordsStr[0]), parseFloat(coordsStr[1])]
    let reg = {
        title: splitted[0],
        coordinates: coords,
        iso3166: splitted[2],
    }
    const restaurant = Restaurant({
        title: req.body.title,
        region: reg,
        description: req.body.description
    })
    await restaurant.save()
    res.redirect('/objects_editor')
})

router.post('/restaurant_delete', async(req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)
    for (const id of checkers) {
        try {
            await Restaurant.deleteOne({ _id : new mongo.ObjectID(id)})
        } catch (e) {console.log(e)}
    }
    res.redirect('/objects_editor')
})


router.post('/cuisine_create', async (req, res) => {
    let regs = []
    if (Array.isArray(req.body.regions)) {
        for (let i=0; i<req.body.regions.length; i++) {
            let splitted = req.body.regions[i].split(':')
            regs.push( {title: splitted[1], iso3166: splitted[0]} )
        }
    } else {
        let splitted = req.body.regions.split(':')
        regs.push( {title: splitted[1], iso3166: splitted[0]} )
    }
  
    const cuisine = new Cuisine({
        title: req.body.title,
        color: req.body.color,
        regions: regs
    })
    await cuisine.save()
    res.redirect('/cuisines_editor')
})

router.post('/cuisine_delete', async (req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)
    for (const id of checkers) {
        try {
            await Cuisine.deleteOne({ _id : new mongo.ObjectID(id)})
        } catch (e) {console.log(e)}
    }
    res.redirect('/cuisines_editor')
})

router.post('/cuisine_edit', async (req, res) => {
    res.redirect('/cuisines_editor')
})


router.post('/partner_create', upload.single('image'), async (req, res) => {
    let img = {
        data: "",
        contentType: 'null',
    }
    try {
        img.data = fs.readFileSync(`public/uploads/${req.file.filename}`)
        img.contentType = 'image/png'
    } catch (e) {}
    let splitted = req.body.title.split(':')

    const partner = Partner({
        title: splitted[1],
        iso3166: splitted[0],
        img: img,
        description: req.body.description,
    })
    await partner.save()
    res.redirect('/partners_editor')
})

router.post('/partner_delete', async (req, res) => {
    const checkers = Array.isArray(req.body.checked) ? req.body.checked : Array.of(req.body.checked)
    for (const id of checkers) {
        try {
            await Partner.deleteOne({ _id : new mongo.ObjectID(id)})
        } catch (e) {console.log(e)}
    }
    res.redirect('/partners_editor')
})

router.post('/partner_edit', async (req, res) => {
    res.redirect('/partners_editor')
})

module.exports = router

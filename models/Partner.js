const {Schema, model} = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true
    },
    iso3166: {
        type: String,
        required: true
    },
    img: {
        data: Buffer,
        contentType: String,
        required: false
    },
    description: {
        type: String,
        required: false
    }
})

module.exports = model('Partner', schema)
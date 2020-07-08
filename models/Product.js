const {Schema, model} = require('mongoose')

const schema = new Schema({
    type: {
        type: String,
        required: true
    },
    typeRU: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: true
    },
    icon_path: {
        type: String,
        required: true
    },
    coordinates: {
        type: Array,
        default: [50, 50]
    },
    region: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    img: {
        data: Buffer,
        contentType: String,
        required: false
    }
})

module.exports = model('Product', schema)
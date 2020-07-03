const {Schema, model} = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    cook_type: { // Вид кухни
        type: String,
        required: true
    },
    coordinates: {
        type: Array,
        default: [50, 50]
    }
})

module.exports = model('Product', schema)
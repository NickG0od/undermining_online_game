const {Schema, model} = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true
    },
    region: {
        type: Object,
        default: {
            title: "Область...",
            coordinates: [0, 0],
            iso3166: "RU_DEF"
        }
    },
    description: {
        type: String,
        required: false
    }
})

module.exports = model('Restaurant', schema)
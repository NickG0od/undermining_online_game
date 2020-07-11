const {Schema, model} = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: "#000000"
    },
    regions: {
        type: Array,
        default: [
            {
                title: "region",
                iso3166: "code"
            }
        ]
    }
})

module.exports = model('Cuisine', schema)
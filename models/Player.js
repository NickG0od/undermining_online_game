const {Schema, model} = require('mongoose')

const schema = new Schema({
    id: {type: String, required: true, index: true, unique: true},
    name: {type: String, required: true},
    roomId: {type: String, required: true},
    expireAt: {type: Date, default: Date.now, index: {expires: '10m'}},
})

module.exports = model('Player', schema)

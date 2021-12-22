const {Schema, model} = require('mongoose')

const schema = new Schema({
    id: {type: String, required: true, index: true, unique: true},
    code: {type: String, required: true, unique: true},
    hostId: {type: String, required: true, unique: true},
    data: {type: JSON},
    expireAt: {type: Date, default: Date.now, index: {expires: '10m'}},
})

module.exports = model('Room', schema)

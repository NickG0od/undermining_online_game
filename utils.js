class Utils {
    constructor() {}

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
}

const utils = new Utils()
module.exports = utils
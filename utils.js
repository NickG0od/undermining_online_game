class Utils {
    constructor() {}

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    getTypeById(country_code, id_type) {
        const typesAll = {
            'ru': {
                'product': "Продукт",
                'dish': "Блюдо",
                'wild_plant': "Дикорос",
                'fish': "Рыба"
            }
        }
        return typesAll[country_code][id_type]
    }
}

const utils = new Utils()
module.exports = utils
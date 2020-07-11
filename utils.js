const fs = require('fs')
const JSONStream = require('JSONStream')


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

    async getDataIcons() {
        const GetData = () => {
            return new Promise((resolve, reject) => {
                let fetchedData = {}
                fs.createReadStream("public/data/static/dataIcons.json")
                    .pipe(JSONStream.parse('*'))
                    .on('data', (data) => {
                        fetchedData = data
                        for (let i = 0; i<fetchedData.length; i++) {
                            fetchedData[i]['id'] = fetchedData[i]['path'].replace("/icons/", '').replace(".png", '')
                        }
                        resolve(fetchedData)
                    })
                    .on('error', reject)
            })
        }
        return await GetData()
    }

    async getDataISO3166() {
        const GetData = () => {
            return new Promise((resolve, reject) => {
                let fetchedData = {}
                fs.createReadStream("public/data/static/dataCodeRegs.json")
                    .pipe(JSONStream.parse('*'))
                    .on('data', (data) => {
                        fetchedData = data
                        resolve(fetchedData)
                    })
                    .on('error', reject)
            })
        }
        return await GetData()
    }
}

const utils = new Utils()
module.exports = utils

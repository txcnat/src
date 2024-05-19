const fs = require('fs')

class Config {
    constructor() {
        const configData = JSON.parse(fs.readFileSync('config.json', 'utf8'))
        this.token = configData.token
        this.email = configData.email
        this.password = configData.password
    }

    getToken() {
        return this.token
    }
    
    getEmail() {
        return this.email
    }

    getPassword() {
        return this.password
    }
}

const instance = new Config()
Object.freeze(instance)

module.exports = instance
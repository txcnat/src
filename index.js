const telebot = require('node-telegram-bot-api')
const puppeteer = require('puppeteer-extra')
const splu = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')
const path = require('path')
const config = require('./app')

puppeteer.use(splu())

const token = config.getToken()
const email = config.getEmail()
const password = config.getPassword()

let browser
let page

function delay(ms) { return new Promise(resolve => { setTimeout(resolve, ms) }) }

async function loginfb(page) {
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' })
    await page.setViewport({ width: 1920, height: 1080 })
    await page.type('#email', email)
    await page.type('#pass', password)
    await page.click('button[name="login"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
}

async function Dialog(page) {
    const dselector = 'div[role="dialog"]'

    try {
        await page.waitForSelector(dselector, { timeout: 5000 })
        const dialog = await page.$(dselector)

        if (dialog) {
            await page.evaluate(() => {
                const allow = document.querySelector('button[role="button"]:nth-child(2)')
                if (allow) {
                    allow.click()
                }
            })
        } else {
            console.log('No notification dialog found')
        }
    } catch (err) {
        console.log('Notification dialog did not appear', err)
    }
}

async function takescr(url) {
    const scrPage = await browser.newPage()
    await scrPage.setViewport({ width: 1920, height: 1080 })
    await scrPage.goto(url, { waitUntil: 'networkidle2' })
    const scrpath = path.join(__dirname, 'photos', `${Date.now()}.png`)
    await delay()
    await scrPage.screenshot({ path: scrpath, fullPage: false })
    return scrpath
}

async function startBot() {
    const bot = new telebot(token, { polling: true })
    browser = await puppeteer.launch({ headless: true, args: ['--disable-notifications'] })
    page = await browser.newPage()
    await loginfb(page)
    await Dialog(page)
    console.log("Khởi động bot thành công !!")

    bot.on('message', (msg) => {
        const chatId = msg.chat.id
        const userId = msg.from.id
        const username = msg.from.username
        const firstName = msg.from.first_name || ''
        const lastName = msg.from.last_name || ''
        const fullName = `${firstName} ${lastName}`
        const messageText = msg.text

        console.log(`
[ LISTEN TO MESSAGES FROM USERS ]
==================================
Chat ID: ${chatId}
User ID: ${userId}
Username: @${username}
FullName: ${fullName}!
Message: ${messageText}
==================================
        `)
    })

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id
        const firstName = msg.from.first_name || ''
        const lastName = msg.from.last_name || ''
        const fullName = `${firstName} ${lastName}`
        
        bot.sendMessage(chatId, `Welcome, ${fullName}!`)
    })

    bot.onText(/\/cap(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id
        const firstName = msg.from.first_name || ''
        const lastName = msg.from.last_name || ''
        const fullName = `${firstName} ${lastName}`
    
        if (match[1]) {
            const url = match[1]
    
            if (url.startsWith('http://') || url.startsWith('https://')) {
                try {
                    bot.sendMessage(chatId, `${fullName} Vui lòng đợi!`)
                    const scrpath = await takescr(url)
                    bot.sendPhoto(chatId, fs.createReadStream(scrpath), {
                        caption: 'Ảnh chụp được từ web',
                        parse_mode: 'Markdown'
                    }).then(() => {
                        fs.unlinkSync(scrpath)
                    }).catch((err) => {
                        console.error('Lỗi khi gửi ảnh:', err)
                    })
                } catch (err) {
                    console.error('Lỗi khi chụp ảnh:', err)
                }
            } else {
                bot.sendMessage(chatId, 'Vui lòng gửi Url hợp lệ')
            }
        } else {
            bot.sendMessage(chatId, `${fullName}, vui lòng sử dụng lệnh /cap + url`)
        }
    })    
}

startBot()


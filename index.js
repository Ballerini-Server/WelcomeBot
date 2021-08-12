import dotenv from 'dotenv'
dotenv.config()
const TOKEN = process.env.TOKEN

import { Client, MessageAttachment } from 'discord.js'
import jimp from 'jimp'
import { Signature } from './signature.js'
import { halos, colors, images } from './themes/info.js'

let theme = 'default'

console.log('Loading images...')
for (const f in images) {
  for (const i of images[f]) {
    await jimp.read(`./themes/${theme}/${f}/${i.filename}`).then(image => {
      i.image = image
    })
  }
}
console.log('Images loaded!')

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const W = 600
const H = 400
const IS = 100
const LUCKY = 60
const LUCKY_DEC = 20

client.on('message', msg => {
  if (msg.content.substr(0, 2) === '! ' && msg.content.length > 2) {
    const sign = new Signature(msg.content.substr(2))
    new jimp(W, H, colors.background, (err, img) => {
      if (err) throw err
      let lucky = LUCKY
      for (let l = 0; l < H / IS; ++l) {
        for (let c = 0; c < W / IS; ++c) {
          if (sign.check(lucky)) {
            lucky = LUCKY
            const item = images.itens[sign.maxedOut(images.itens.length)].image
            const colored = new jimp(item.bitmap.width, item.bitmap.height, colors.itens[sign.maxedOut(colors.itens.length)], (err, img) => {
              if (err) throw err
              return img
            })
            colored.mask(item, 0, 0)
            img.composite(colored, c * IS + sign.maxedOut(IS - item.bitmap.width), l * IS + sign.maxedOut(IS - item.bitmap.height))
          } else {
            lucky -= LUCKY_DEC
          }
        }
      }
      img.getBuffer(jimp.MIME_PNG, (err, image) => {
        if (err) throw err
        msg.channel.send(`<@${msg.author.id}>, a imagem gerada foi:`, new MessageAttachment(image, 'image.jpg'))
      })
    })
  }
})

console.log('Trying to connect to Discord...')
client.login(TOKEN)
console.log('Loggin in...')
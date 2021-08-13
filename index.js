import dotenv from 'dotenv'
dotenv.config()
const TOKEN = process.env.TOKEN

const W = 600
const H = 300
const IS = 100
const LUCKY = 60
const LUCKY_DEC = 30
const AVATAR_SIZE = 200
const AVATAR_BORDER = 50
const AVATAR_STROKE = 10

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
for (const h of halos) {
  h.image = new jimp(AVATAR_SIZE + AVATAR_STROKE, AVATAR_SIZE + AVATAR_STROKE, h.color, (err, image) => {
    if (err) throw err
    image.circle()
    return image
  })
}
console.log('Images loaded!')

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async msg => {
  if (msg.content.substr(0, 2) === '! ' && msg.content.length > 2) {
    const sign = new Signature(msg.content.substr(2))
    const halo = sign.max(100)
    new jimp(W, H, colors.background, async (err, img) => {
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
      let avatar
      await jimp.read(msg.author.displayAvatarURL({ format: 'png' })).then(image => {
        image.resize(AVATAR_SIZE, AVATAR_SIZE)
        image.circle()
        avatar = image
      })
      img.composite(halos.find(h => h.max >= halo).image, W - AVATAR_SIZE - AVATAR_STROKE / 2 - AVATAR_BORDER, (H - AVATAR_SIZE - AVATAR_STROKE) / 2)
      img.composite(avatar, W - AVATAR_SIZE - AVATAR_BORDER, (H - AVATAR_SIZE) / 2)

      const font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE)
      img.print(font, 10, 10, `${halo}%`)
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
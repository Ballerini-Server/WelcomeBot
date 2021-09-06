import dotenv from 'dotenv'
dotenv.config()
const TOKEN = process.env.TOKEN

import { Client, MessageAttachment, MessageEmbed } from 'discord.js'
import jimp from 'jimp'
import { Signature } from './signature.js'
import { halos, colors, images, messages } from './themes/info.js'
import { title, description, fields, footer } from './themes/messageEmbed.js'
import { W, H, IS, LUCKY, LUCKY_DEC, AVATAR_SIZE, AVATAR_BORDER, AVATAR_STROKE, BALLE_SIZE, BALLE_STROKE } from './themes/constants.js'

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

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`))

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
            const item = images.assets[sign.maxedOut(images.assets.length)].image
            const colored = new jimp(item.bitmap.width, item.bitmap.height, colors.assets[sign.maxedOut(colors.assets.length)])
            const x = c * IS + sign.maxedOut(IS - item.bitmap.width)
            const y = l * IS + sign.maxedOut(IS - item.bitmap.height)
            colored.mask(item, 0, 0)
            img.blit(colored, x, y)
          } else lucky -= LUCKY_DEC
        }
      }

      let avatar
      await jimp.read(msg.author.displayAvatarURL({ format: 'png' })).then(image => {
        image.resize(AVATAR_SIZE, AVATAR_SIZE)
        image.circle()
        avatar = image
      })
      img.blit(halos.find(h => h.max >= halo).image, (W - AVATAR_SIZE - AVATAR_STROKE) / 2, AVATAR_BORDER)
      img.blit(avatar, (W - AVATAR_SIZE) / 2, AVATAR_BORDER + AVATAR_STROKE / 2)
      
      const drawText = (text, backgroundColor, w, h) => {
        const tw = jimp.measureText(font, text)
        const th = jimp.measureTextHeight(font, text)
        const ti = new jimp(tw, th, backgroundColor)
        ti.print(font, 0, 0, text)
        let nw = tw * h / th
        let nh = h
        if (nw > w) {
          nw = w
          nh = th * w / tw
        }
        return ti.resize(nw, nh)
      }

      const tag = msg.author.tag
      const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE)
      const textTag = drawText(tag, 0x00000000, W, 200)
      const maskTag = drawText(tag, 0x000000ff, W, 200)
      const shadowTag = new jimp(maskTag.bitmap.width, maskTag.bitmap.height, colors.primary)
      shadowTag.mask(maskTag, 0, 0)
      img.blit(shadowTag, (W - textTag.bitmap.width) / 2 - 3, H - 380 - 3)
      img.blit(textTag, (W - textTag.bitmap.width) / 2, H - 380)

      const message = messages[sign.maxedOut(messages.length)]
      const textMessage = drawText(message, 0x00000000, W, 100)
      const maskMessage = drawText(message, 0x000000ff, W, 100)
      const shadowMessage = new jimp(maskMessage.bitmap.width, maskMessage.bitmap.height, colors.primary)
      shadowMessage.mask(maskMessage, 0, 0)
      img.blit(shadowMessage, (W - textMessage.bitmap.width) / 2 - 3, H - textMessage.bitmap.height - 50 - 3)
      img.blit(textMessage, (W - textMessage.bitmap.width) / 2, H - textMessage.bitmap.height - 50)

      await img.getBuffer(jimp.MIME_PNG, (err, image) => {
        if (err) throw err
        const messageEmbed = new MessageEmbed()
          .setTitle(title.replace('{0}', msg.author.tag))
          .setDescription(description.replace('{0}', `<@${msg.author.id}>`))
          .setColor(colors.background.color)
          .addFields(fields)
          .attachFiles(new MessageAttachment(image, 'image.png'))
          .setImage(`attachment://image.png`)
          .setFooter(footer.replace('{0}', halo))
        msg.channel.send(`<@${msg.author.id}>`, { embed: messageEmbed })
      })
    })
  }
})

console.log('Trying to connect to Discord...')
client.login(TOKEN)
console.log('Loggin in...')
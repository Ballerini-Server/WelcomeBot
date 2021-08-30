import dotenv from 'dotenv'
dotenv.config()
const TOKEN = process.env.TOKEN

import { Client, MessageAttachment, MessageEmbed } from 'discord.js'
import jimp from 'jimp'
import { Signature } from './signature.js'
import { halos, colors, images } from './themes/info.js'
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
      const space = W - AVATAR_SIZE - AVATAR_BORDER * 1.5 + AVATAR_STROKE * 2
      const xLogo = (space - images.itens[0].image.bitmap.width) / 2
      const yLogo = 30

      for (let l = 0; l < H / IS; ++l) {
        for (let c = 0; c < W / IS; ++c) {
          if (sign.check(lucky)) {
            lucky = LUCKY
            const item = images.assets[sign.maxedOut(images.assets.length)].image
            const colored = new jimp(item.bitmap.width, item.bitmap.height, colors.assets[sign.maxedOut(colors.assets.length)])
            const x = c * IS + sign.maxedOut(IS - item.bitmap.width)
            const y = l * IS + sign.maxedOut(IS - item.bitmap.height)

            if(((x + item.bitmap.width) >= xLogo && x <= (xLogo + images.itens[0].image.bitmap.width)) 
            && ((y + item.bitmap.height) >= yLogo && (y <= yLogo + images.itens[0].image.bitmap.height))) {
              continue
            }

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
      img.blit(halos.find(h => h.max >= halo).image, W - AVATAR_SIZE - AVATAR_STROKE / 2 - AVATAR_BORDER, (H - AVATAR_SIZE - AVATAR_STROKE) / 2)
      img.blit(avatar, W - AVATAR_SIZE - AVATAR_BORDER, (H - AVATAR_SIZE) / 2)

      img.blit(images.itens[0].image, xLogo, yLogo)
      
      const drawText = (text, backgroundColor) => {
        const tw = jimp.measureText(font, text)
        const th = jimp.measureTextHeight(font, text)
        const ti = new jimp(tw, th, backgroundColor)
        ti.print(font, 0, 0, text)
        let nw = tw * strip.h / th
        let nh = strip.h
        if (nw > strip.w) {
          nw = strip.w
          nh = th * strip.w / tw
        }
        return ti.resize(nw, nh)
      }

      const tag = msg.author.tag
      const font = await jimp.loadFont('./fonts/DINRundschriftBreit.ttf.fnt')
      const strip = images.strips[sign.maxedOut(images.strips.length)]
      const sx = (space - images.strips[0].image.bitmap.width) / 2
      const sy = 80
      img.blit(strip.image, sx, sy)
      const text = drawText(tag, 0x00000000)
      const mask = drawText(tag, 0x000000ff)
      const shadow = new jimp(mask.bitmap.width, mask.bitmap.height, colors.primary)
      shadow.mask(mask, 0, 0)
      img.blit(shadow, sx + strip.x + (strip.w - text.bitmap.width) / 2 - 1, sy + strip.y + (strip.h - text.bitmap.height) / 2 - 1)
      img.blit(text, sx + strip.x + (strip.w - text.bitmap.width) / 2, sy + strip.y + (strip.h - text.bitmap.height) / 2)

      const stroke = new jimp(BALLE_SIZE + BALLE_STROKE, BALLE_SIZE + BALLE_STROKE, colors.foreground)
      const balle = images.balles[sign.maxedOut(images.balles.length)].image
      balle.resize(BALLE_SIZE, BALLE_SIZE)
      balle.circle()
      stroke.blit(balle, (stroke.bitmap.width - balle.bitmap.width) / 2, (stroke.bitmap.height - balle.bitmap.height) / 2)
      stroke.circle()
      img.blit(stroke, (space - stroke.bitmap.width) / 2, H - stroke.bitmap.height - 15)

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
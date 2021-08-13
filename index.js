import dotenv from 'dotenv'
dotenv.config()
const TOKEN = process.env.TOKEN

import { Client, MessageAttachment, MessageEmbed } from 'discord.js'
import jimp from 'jimp'
import { Signature } from './signature.js'
import { halos, colors, images } from './themes/info.js'
import { description, fields, footer } from './themes/messageEmbed.js'
import { W, H, IS, LUCKY, LUCKY_DEC, AVATAR_SIZE, AVATAR_BORDER, AVATAR_STROKE } from './themes/constants.js'

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
            const colored = new jimp(item.bitmap.width, item.bitmap.height, colors.assets[sign.maxedOut(colors.assets.length)], (err, img) => {
              if (err) throw err
              return img
            })
            colored.mask(item, 0, 0)
            img.blit(colored, c * IS + sign.maxedOut(IS - item.bitmap.width), l * IS + sign.maxedOut(IS - item.bitmap.height))
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
      img.blit(images.itens[0].image, 10 + AVATAR_BORDER / 4, 10)
      img.blit(images.strips[0].image, 10 + AVATAR_BORDER / 4, 60)

      const font2 = await jimp.loadFont('./fonts/DINRundschriftBreit.ttf.fnt')
      img.print(font2, 10 + AVATAR_BORDER / 4, 60, {
        text: msg.author.tag,
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
      }, images.strips[0].image.bitmap.width, images.strips[0].image.bitmap.height)

      img.getBuffer(jimp.MIME_PNG, (err, image) => {
        if (err) throw err
        const messageEmbed = new MessageEmbed()
          .setTitle(`${msg.author.tag} | Bem-vindx! #${halo}`)
          .setDescription(`Salve <@${msg.author.id}> ${description}`)
          .setColor(colors.background.color)
          // .setThumbnail(msg.author.displayAvatarURL({ format: 'png' }))
          .addFields(fields)
          .attachFiles(new MessageAttachment(image, 'image.png'))
          .setImage(`attachment://image.png`)
          .setFooter(footer)
          msg.channel.send({ embed: messageEmbed })
      })
    })
  }
})

console.log('Trying to connect to Discord...')
client.login(TOKEN)
console.log('Loggin in...')
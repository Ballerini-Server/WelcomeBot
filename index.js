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

import { Client, MessageAttachment, MessageEmbed } from 'discord.js'
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
            const item = images.assets[sign.maxedOut(images.assets.length)].image
            const colored = new jimp(item.bitmap.width, item.bitmap.height, colors.assets[sign.maxedOut(colors.assets.length)], (err, img) => {
              if (err) throw err
              return img
            })
            colored.mask(item, 0, 0)
            img.blit(colored, c * IS + sign.maxedOut(IS - item.bitmap.width), l * IS + sign.maxedOut(IS - item.bitmap.height))
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
      img.blit(halos.find(h => h.max >= halo).image, W - AVATAR_SIZE - AVATAR_STROKE / 2 - AVATAR_BORDER, (H - AVATAR_SIZE - AVATAR_STROKE) / 2)
      img.blit(avatar, W - AVATAR_SIZE - AVATAR_BORDER, (H - AVATAR_SIZE) / 2)

      // DEBUG
      let font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE)
      img.print(font, 10, 10, `${halo}%`)
      // DEBUG

      img.blit(images.itens[0].image, (10 + AVATAR_BORDER / 4), 10)
      img.blit(images.strips[0].image, 10 + AVATAR_BORDER / 4, 60)
      const font2 = await jimp.loadFont('./fonts/DINRundschriftBreit.ttf.fnt')
      img.print(font2, 10 + AVATAR_BORDER / 4, 60, {
        text: msg.author.tag,
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
      }, images.strips[0].image.bitmap.width, images.strips[0].image.bitmap.height)
      img.getBuffer(jimp.MIME_PNG, (err, image) => {
        if (err) throw err
        const embed = new MessageEmbed()
          .setTitle(`${msg.author.tag} | Bem-vindx!`)
          .setDescription(`Salve <@${msg.author.id}> Você acabou de entrar no servidor Ballerini. Aqui você poderá interagir com a comunidade, jogar, encontrar vagas, conversar sobre programação, tecnologia e muito mais!`)
          .setColor(colors.background.color)
          .setThumbnail(msg.author.displayAvatarURL({ format: 'png' }))
          .addFields(
            { name: 'Importante!', value: 'Conheça todas as regras do servidor para não ter nenhum problema <#836004917973614665>', inline: true },
            { name: 'Primeiros passos', value: 'Para receber um cargo siga as instruções em <#872137949788135436>', inline: true },
            { name: 'Apresente-se!', value: 'Conte um pouco mais sobre você em <#867928382086721556>', inline: true },
            { name: 'Fique atento', value: 'Novos vídeos serão anunciados em <#859235851178868776>', inline: true },
            { name: 'Inscreva-se no canal', value: '[Rafaella Ballerini](https://www.youtube.com/RafaellaBallerini)', inline: true },
            { name: 'Siga no Instagram!', value: '[@rafaballerini](https://instagram.com/rafaballerini)', inline: true }
          )
          .attachFiles(new MessageAttachment(image, 'image.png'))
          .setImage(`attachment://image.png`)
          .setFooter('Aproveite!')
          msg.channel.send({ embed: embed })
      })
    })
  }
})

console.log('Trying to connect to Discord...')
client.login(TOKEN)
console.log('Loggin in...')
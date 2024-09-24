const axios = require('axios')
const cheerio = require('cheerio')
const dotenv = require('dotenv')
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID

const { REST, Routes, Client, GatewayIntentBits } = require('discord.js')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const rest = new REST({ version: '10' }).setToken(TOKEN)

const tabnewsLink = 'https://www.tabnews.com.br/'

const commands = [
  {
    name: 'relevantes',
    description: 'Artigos Relevantes do Tabnews'
  },
  {
    name: 'recentes',
    description: 'Artigos Recentes do Tabnews'
  },
]

try {
  console.log('Started refreshing application (/) commands.')

  rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })

  console.log('Successfully reloaded application (/) commands.')
} catch (error) {
  console.error(error)
}

async function scrapeTabnews(tag) {
  try {
    const response = await axios.get(tag)
    const $ = cheerio.load(response.data)
    const items = $('.bKvFHa > li')
    const articleList = []

    items.each((_, element) => {
      const $element = $(element)
      const title = $element.find('.fNHvuH > article > div:nth-child(1)').text().trim()
      const score = $element.find('.fNHvuH > article > div:nth-child(2) > span:nth-child(1)').text().trim()
      const author = $element.find('.fNHvuH > article > div:nth-child(2) > span:nth-child(3)').text().trim()
      const howLong = $element.find('.fNHvuH > article > div:nth-child(2) > span:nth-child(4)').text().trim()
      const link = 'https://www.tabnews.com.br' + $element.find('.fNHvuH > article > div:nth-child(1) > a').attr('href')

      const articleItem = {
        title,
        score,
        author,
        howLong,
        link
      }

      articleList.push(articleItem)

    })

    console.log(articleList)
    return articleList

  } catch (error) {
    console.error(error)
  }
}

function formatArticles(article) {
  return `
  **📄[${article.title}](${article.link})**
  ${article.score} - ${article.author} - ${article.howLong}\n`
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'relevantes') {
    try {
      const articleList = await scrapeTabnews(tabnewsLink)
      let response = ''
      const maxLinksToShow = 10

      if (articleList.length > maxLinksToShow) {
        response += '**Últimos Artigos do Tabnews**\n'
        for (let i = 1; i < maxLinksToShow; i++) {
          response += formatArticles(articleList[i])
        }
      } else {
        articleList.forEach(articles => {
          response += formatArticles(articles)
        })
      }

      await interaction.reply(response)

    } catch (error) {
      console.error(error)
      await interaction.reply('Ocorreu um erro ao obter os artigos')
    }
  }
})

client.login(TOKEN)
import { Telegraf, session } from  'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { oga } from './oga.js'
import { openai } from './openai.js'

console.log(config.get('TEST_ENV'));

const INITIAL_SESSION = {
    messages: []
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async ctx => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду ваше сообщение.')
})

bot.command('start', async ctx => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду ваше сообщение.')
})

bot.on(message('text'), async ctx => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Ожидается ответ от сервера...'))

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text
        })

        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        })

        await ctx.reply(response.content)
    } catch (error) {
        console.error(`Error while text message`, error.message);
    }
})

bot.on(message('voice'), async ctx => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Ожидается ответ от сервера...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const ogaPath = await oga.create(link.href, userId)
        const mp3Path = await oga.toMp3(ogaPath, userId)

        const text = await openai.transcription(mp3Path)

        await ctx.reply(code(`Ваш запрос: ${text}`))

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: text
        })

        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        })

        await ctx.reply(response.content)
    } catch (error) {
        console.error(`Error while voice message`, error.message);
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
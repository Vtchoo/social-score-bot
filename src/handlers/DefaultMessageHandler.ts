import { format } from 'date-fns'
import { IMessageHandler, MessageHandlerContext } from '../types'
import { Message } from 'discord.js'
import Gemini from '../services/AI/Gemini'
import { randomString } from '../utils/string'
import GuildMessageBatch from '../core/GuildMessageBatch'
import bot from '../core/Bot'
import MessageScore from '../models/MessageScore'

let messageScoreRequestTimeout: NodeJS.Timeout | null = null

// interface GuildMessage {
//     id: string
//     guildId: string
//     userId: string
//     content: string
// }

let messagesToEvaluate: GuildMessageBatch[] = []

const aiModel = new Gemini()

class DefaultMessageHandler implements IMessageHandler {

    private MAX_ACCUMULATED_MESSAGES = 20

    async execute({ client, message }: MessageHandlerContext): Promise<void> {

        if (message.author.bot)
            return

        if (!message.guild)
            return

        if (message.content === '')
            return

        if (!message.member)
            return

        // messagesToEvaluate.push({
        //     id: message.id,
        //     guildId: message.guild.id,
        //     userId: message.author.id,
        //     content: message.content,
        // })

        await bot.saveUserData(message.member)

        // Get last message from the channel
        const lastChannelMessage = [...messagesToEvaluate].reverse().find(m => m.channelId === message.channel.id)
        if (lastChannelMessage && lastChannelMessage.userId === message.author.id) {
            console.log(`Adding message to batch ${lastChannelMessage.id}`)
            lastChannelMessage.addMessage(message)
        } else {
            messagesToEvaluate.push(new GuildMessageBatch(message))
        }


        if (messageScoreRequestTimeout)
            clearTimeout(messageScoreRequestTimeout)

        if (messagesToEvaluate.length >= this.MAX_ACCUMULATED_MESSAGES) {
            evaluateMessages()
            return
        }

        messageScoreRequestTimeout = setTimeout(() => {
            evaluateMessages()
        }, 30000)

        async function evaluateMessages() {
            try {
                console.log('Evaluating messages...')
                console.log(messagesToEvaluate.map(m => m.content).join('\n'))
    
                const promise = aiModel.getMessageScores(messagesToEvaluate, {
                    minScore: -1,
                    maxScore: 1,
                })

                const sentMessages = [...messagesToEvaluate]
    
                messagesToEvaluate = []
    
                const result = await promise

                if (!result || result.length === 0) 
                    return

                const scores = result
                    .map(r => {
                        const messageBatch = sentMessages.find(m => m.id === r.messageId)
                        if (!messageBatch)
                            return null

                        return {
                            messageId: r.messageId,
                            reason: r.reason,
                            score: r.score,
                            content: messageBatch.content,
                            channelId: messageBatch.channelId,
                            userId: messageBatch.userId,
                            guildId: messageBatch.guildId,
                            createdAt: new Date()
                        } as MessageScore
                    })
                    .filter(r => r !== null)
                    .filter(r => r?.score !== 0) as MessageScore[]

                await bot.saveMessageScores(scores)
    
                // console.log(JSON.stringify(result))
            } catch (error) {
                console.log(error)
            }
        }
    }
}

export default DefaultMessageHandler

import { Message } from 'discord.js'
import { messageDelimiter } from './Shared'

export class GuildMessageBatch {

    rawMessages: Message[]

    guildId: string
    userId: string
    channelId: string

    constructor(rawMessage: Message<true>) {
        this.rawMessages = [rawMessage]
        this.guildId = rawMessage.guild.id
        this.userId = rawMessage.author.id
        this.channelId = rawMessage.channel.id
    }

    // returns the last message id
    get id() {
        const index = this.rawMessages.length - 1
        return this.rawMessages[index].id
    }

    // returns the content of all messages
    get content() {
        return this.rawMessages
            .map(m => JSON.stringify({
                content: m.content,
                embeds: m.embeds.map(e => ({
                    title: e.title,
                    description: e.description,
                }))
            }))
            .join(`\n---------- ${messageDelimiter} ----------\n`)
    }

    // get embeds() {
    //     return this.rawMessages.map(m => m.embeds).map(e => {
    //         e.
    //         return {}
    //     })
    // }

    addMessage(rawMessage: Message<true>) {

        if (this.guildId !== rawMessage.guild.id)
            throw new Error('Cannot add message from different guild')
        if (this.userId !== rawMessage.author.id)
            throw new Error('Cannot add message from different user')
        if (this.channelId !== rawMessage.channel.id)
            throw new Error('Cannot add message from different channel')

        this.rawMessages.push(rawMessage)
    }
}

export default GuildMessageBatch

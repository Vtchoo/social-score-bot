import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { CommandHandlerParams, ICommand } from '../types'
import bot, { UserNotFoundError } from '../core/Bot'
import { sendMessage } from '../utils/discord'
import { format } from 'date-fns'

class HistoryCommand implements ICommand {
    definition = new SlashCommandBuilder()
        .setName('history')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the history of')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('global')
                .setDescription('Get the global history')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option.setName('page')
                .setDescription('The page number')
                .setRequired(false)
        )
        .setDescription('Get the history of negative messages of a user')
    
    async execute({ client, interaction }: CommandHandlerParams) {
        
        const global = interaction.options.getBoolean('global') || false

        if (!interaction.deferred)
            await interaction.deferReply({ ephemeral: global })

        if (!interaction.inCachedGuild())
            return await sendMessage(interaction, { description: 'Invalid guild (?)' })

        try {

            const guildMember = interaction.options.getMember('user') || interaction.member

            const page = Math.max(1, interaction.options.getNumber('page') || 1)
            const pageSize = 10

            if (global && guildMember.id !== interaction.member.id)
                return await sendMessage(interaction, { description: 'You can only get your own global history' })

            const history = await bot.getUserHistory(guildMember.id, interaction.guildId, { requestedBy: interaction.member, page, pageSize, global })

            if (history.count === 0)
                return await sendMessage(interaction, { description: 'No messages found' })

            let title = `**${guildMember.displayName}**'s history`
            if (global)
                title = `Global history for **${guildMember.displayName}**`

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor('Blue')
                .setDescription(history.messages.map(m => `[${format(m.createdAt, 'yyyy-MM-dd')}] https://discord.com/channels/${m.guildId}/${m.channelId}/${m.messageId} - ${m.reason || 'No reason informed'}`).join('\n'))
                .setFooter({ text: `Page ${page}/${history.totalPages}` })
                .setImage(this.readingListImage)

            await interaction.editReply({ embeds: [embed] })
            
        } catch (error) {
            console.log(error)

            if (error instanceof UserNotFoundError)
                return await sendMessage(interaction, { description: 'User not found' })

            throw error
        }
    }

    private readonly negativeSocialScoreImage = 'https://i.imgur.com/1Q2J9Qo.png'
    private readonly readingListImage = 'https://cdn.discordapp.com/attachments/1228719988609912903/1229887244483952731/reading_list.webp?ex=663150c1&is=661edbc1&hm=95f5c16c50ea19c9d681039a57dd90c83ab9dfceb8c695971fa73ab4f9b3d206&'
}

const command = new HistoryCommand()

export default command

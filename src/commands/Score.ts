import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, userMention } from 'discord.js'
import { CommandHandlerParams, ExtendedChatInputCommandInteraction, ICommand } from '../types'
import bot, { UserNotFoundError } from '../core/Bot'
import { sendMessage } from '../utils/discord'

class ScoreCommand implements ICommand {
    definition = new SlashCommandBuilder()
        .setName('score')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the score of')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('global')
                .setDescription('Get the global score')
                .setRequired(false)
        )
        .setDescription('Get the score of a user')
    
    async execute({ client, interaction }: CommandHandlerParams) {
        
        const global = interaction.options.getBoolean('global') || false

        if (!interaction.deferred)
            await interaction.deferReply({ ephemeral: global })

        if (!interaction.inCachedGuild())
            return await sendMessage(interaction, { description: 'Invalid guild (?)' })

        const guildMember = interaction.options.getMember('user') || interaction.member
        
        if (global && guildMember.id !== interaction.member.id)
            return await sendMessage(interaction, { description: 'You can only get your own global score' })

        try {

            const score = await bot.getUserScore(guildMember.id, interaction.guildId, { requestedBy: interaction.member })

            let title = `**${guildMember.displayName}** has a social credit score of _**${score.score}**_`

            // Mention the user
            // let title = `${userMention(guildMember.id)} has a social credit score of _**${score.score}**_`

            if (global && score.globalScore)
                title += `\nGlobal score: _**${score.globalScore}**_`

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(score.score < 0 ? 'Red' : 'Green')
                .setImage(score.score < 0 ? this.negativeSocialScoreImage : this.positiveSocialScoreImage)
            
            await interaction.editReply({ embeds: [embed] })
            
        } catch (error) {
            console.log(error)

            if (error instanceof UserNotFoundError)
                return await sendMessage(interaction, { description: 'User not found' })

            throw error
        }
    }

    private readonly positiveSocialScoreImage = `https://cdn.discordapp.com/attachments/1228719988609912903/1229822649870585916/green_social_score.png?ex=66311498&is=661e9f98&hm=cb4482ff368f367b5e0a480b623431f31acb3a501a975c516dde447ab853e578&`
    private readonly negativeSocialScoreImage = `https://cdn.discordapp.com/attachments/1228719988609912903/1229822650348732476/red_social_score.png?ex=66311498&is=661e9f98&hm=ff3dcbe5f006ebf4de44af41ae258ea73e811d82b025630b1b42a80dd1cab1e2&`
}

const scoreCommand = new ScoreCommand()

export default scoreCommand

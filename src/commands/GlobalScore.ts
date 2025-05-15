import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js'
import { CommandHandlerParams, ExtendedChatInputCommandInteraction, ICommand } from '../types'
import { sendMessage } from '../utils/discord'
import bot, { UserNotFoundError } from '../core/Bot'

class GlobalScore implements ICommand {

    definition: ExtendedChatInputCommandInteraction = {
        name: 'globalscore',
        description: 'Get the score of a user',
        contexts: [0, 1, 2],
        integration_types: [1],
        options: [
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'global',
                description: 'Get the global score',
                required: false,
            },
        ]
    }
    
    async execute({ client, interaction }: CommandHandlerParams) {

        const global = interaction.options.getBoolean('global') || true

        if (!interaction.deferred)
            await interaction.deferReply({ ephemeral: true })

        const user = interaction.user

        try {

            const score = await bot.getUserScore(user.id, undefined, { requestedBy: interaction.user as any })

            if (!score.globalScore)
                return await sendMessage(interaction, { description: 'User not found' })

            let title = `**${user.displayName}** has a global social credit score of _**${score.globalScore}**_`

            // Mention the user
            // let title = `${userMention(guildMember.id)} has a social credit score of _**${score.score}**_`

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(score.globalScore < 0 ? 'Red' : 'Green')
                .setImage(score.globalScore < 0 ? this.negativeSocialScoreImage : this.positiveSocialScoreImage)
            
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

const globalScoreCommand = new GlobalScore()

export default globalScoreCommand

import { EmbedBuilder, SlashCommandBuilder, userMention } from 'discord.js'
import { CommandHandlerParams, ICommand } from '../types'
import { sendMessage } from '../utils/discord'
import bot from '../core/Bot'

class LeaderBoardCommand implements ICommand {

    readonly definition = new SlashCommandBuilder()
        .setName('leaderboard')
        .addBooleanOption(option =>
            option.setName('negative')
                .setDescription('Show the negative leaderboard')
                .setRequired(false)
        )
        .setDescription('Show the leaderboard')
    
    async execute({ client, interaction }: CommandHandlerParams) {

        if (!interaction.deferred)
            await interaction.deferReply()

        if (!interaction.inCachedGuild())
            return sendMessage(interaction, { description: 'You must be in a guild to run this command' })

        const leaderboard = await bot.getLeaderboard(interaction.guildId, 1, 10)

        if (leaderboard.count === 0)
            return sendMessage(interaction, { description: 'No users found' })

        const users = leaderboard.results.map((user, index) => {
            return `${index + 1}. **${userMention(user.id)}** - ${user.score}`
        })

        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .setColor('Green')
            .setDescription(users.join('\n'))
            // .setFooter({ text: `Page 1/${leaderboard.totalPages}` })
            .setThumbnail(this.positiveSocialScoreImage)
            // .setFooter({ text: `Total users: ${leaderboard.totalResults}` })
        
        await interaction.editReply({ embeds: [embed] })
    }

    private readonly socialScoreLeaderboardImage = `https://cdn.discordapp.com/attachments/1228719988609912903/1233165499924353085/e18-133.jpg?ex=662c1a5e&is=662ac8de&hm=ed803d9142203a069db8214d1924529762c4834886e94fe7a55e29205318a4d5&`
    private readonly positiveSocialScoreImage = `https://cdn.discordapp.com/attachments/1228719988609912903/1229822649870585916/green_social_score.png?ex=66311498&is=661e9f98&hm=cb4482ff368f367b5e0a480b623431f31acb3a501a975c516dde447ab853e578&`
    private readonly negativeSocialScoreImage = `https://cdn.discordapp.com/attachments/1228719988609912903/1229822650348732476/red_social_score.png?ex=66311498&is=661e9f98&hm=ff3dcbe5f006ebf4de44af41ae258ea73e811d82b025630b1b42a80dd1cab1e2&`
}

const leaderboard = new LeaderBoardCommand()

export default leaderboard

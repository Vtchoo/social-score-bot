import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

export interface SendMessageOptions {
    title?: string
    description?: string
    thumbnail?: string
}

export async function sendMessage(interaction: ChatInputCommandInteraction<'cached'>, { title, description, thumbnail }: SendMessageOptions) {
    const embed = new EmbedBuilder()
        .setTitle(title || null)
        .setDescription(description || null)
        .setThumbnail(thumbnail || null)
        .setColor(0xf9b773)

    await interaction.editReply({ embeds: [embed] })
}

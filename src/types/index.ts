import { SlashCommandBuilder, Client, ChatInputCommandInteraction, Message } from 'discord.js'

interface CommandHandlerParams {
    client: Client
    interaction: ChatInputCommandInteraction<'cached'>
}

interface ICommand {
    definition: SlashCommandBuilder
    execute(params: CommandHandlerParams): Promise<void>
}

interface MessageHandlerContext {
    client: Client
    message: Message<true>
}

interface IMessageHandler {
    execute(context: MessageHandlerContext): Promise<void>
}

export { ICommand, CommandHandlerParams, IMessageHandler, MessageHandlerContext }

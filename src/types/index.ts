import { SlashCommandBuilder, Client, ChatInputCommandInteraction, Message, RESTPostAPIChatInputApplicationCommandsJSONBody, REST } from 'discord.js'

interface CommandHandlerParams {
    client: Client
    interaction: ChatInputCommandInteraction
}

export type ExtendedChatInputCommandInteraction = RESTPostAPIChatInputApplicationCommandsJSONBody & { contexts: number[], integration_types: number[] }

interface ICommand {
    definition: SlashCommandBuilder | ExtendedChatInputCommandInteraction
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

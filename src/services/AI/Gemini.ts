import { FunctionDeclarationSchemaProperty, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { Message } from 'discord.js'
import zod, { ZodError } from 'zod'
import GuildMessageBatch from '../../core/GuildMessageBatch'
import { messageDelimiter } from '../../core/Shared'

const MODEL_NAME = 'gemini-1.5-pro'
const API_KEY = process.env.GEMINI_API_KEY as string

const genAI = new GoogleGenerativeAI(API_KEY)

const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
}

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

interface MessageScoreRequestContext {
    maxScore: number
    minScore: number
    instructions?: string
}

const removedExampleMessage = `{
    "messageId": "1777737510428868608",
    "userId": "1037425458566270978",
    "guildId": "1443286926592204800",
    "channelId": "1443286926592204815",
    "content": {
        "content": "[insert some offensive message here]",
    },
}`

class Gemini {

    private readonly model =  genAI.getGenerativeModel({ model: MODEL_NAME })//, { apiVersion: 'v1beta' })
    // private readonly model =  genAI.getGenerativeModel({ model: MODEL_NAME })
    async getMessageScores(messages: GuildMessageBatch[], { maxScore = 1, minScore = -1, ...context }: MessageScoreRequestContext) {
        
        // console.log(messages.map(message => ({
        //     text: JSON.stringify({
        //         messageId: message.id,
        //         userId: message.author.id,
        //         guildId: message.guild?.id,
        //         content: message.content,
        //     }) + '\n'
        // })))

        // console.log(messages.map(message => JSON.stringify({
        //     messageId: message.id,
        //     userId: message.author.id,
        //     guildId: message.guild?.id,
        //     content: message.content,
        // })).join('\n'))

        const MAX_ATTEMPTS = 5
        let attempts = 0

        // let response: any[] | null = null

        while (attempts < MAX_ATTEMPTS) {// && !response) {

            attempts++
            // 
            const contents = [
                {
                    role: 'user', parts: [
                        {
                            // text: `
                            //     You are a bot that evaluates and set scores for chat messages in discord servers.
                            //     You must give a score from ${minScore} and ${maxScore}, always integer.
                            //     You can ignore messages that are too short, their score will be 0.
                            //     ${context.instructions || ''}
                            //     If you think the message is harmful or spam, set a negative score to it.
                            //     If you think the message is good, or at least neutral and could possibly contribute to the conversation, set a positive score to it.
                            //     The messages must be, currently, evaluated without any context, just the message itself.
                            //     In order to evaluate the messages, you must call the function evaluateMessages as provided, passing the score for all the messages.
                            //     If there is more than one message, you must call the function for each message.
                            //     The messages are:`,
                            text: `
                                You are a bot that evaluates and set scores for chat messages in discord servers.
                                You must give a score from ${minScore} and ${maxScore}, always integer.
                                You can ignore messages that are too short, their score will be 0, no need to evaluate it.
                                Consecutive messages from the same user on the same channel are grouped together, you can evaluate them as a single message, and are separated by a message delimiter: ${messageDelimiter}.
                                ${context.instructions || ''}
                                If you think the message is harmful, set a negative score to it.
                                Laughs (incl. with random characters), jokes, nonsense, gibberish and sarcasm are NOT harmful. Main social media links like, X (Twitter), TikTok and Reddit are also not harmful, unless the content itself is (usually in embeds).
                                If you think the message is good, or at least neutral and could possibly contribute to the conversation, set a positive score to it.
                                The messages must be, currently, evaluated without any context, just the message itself.
                                In order to evaluate the messages, you must respond to this message with a JSON object with the following array format:
                                [{
                                    "messageId": "the message id",
                                    "score": the score of the message, integer,
                                    "reason": "optional, the reason for the score if it is harmful in a non-obvious way, like an obscure reference or a joke that could be misinterpreted. Max 255 characters"
                                },
                                {
                                    ...
                                }]
                                No text is needed, no code block, just the plain JSON object.
                                The first part are example messages, after you answer these first ones, you will receive the actual messages to evaluate.`,
                        },
                        {
                            text: `{
                                "messageId": "1037425364332843009",
                                "userId": "1037425458566270978",
                                "guildId": "1443286926592204800",
                                "channelId": "1443286926592204815",
                                "content": {
                                    "content": "Hello everyone, how are you doing?",
                                },
                            }
                            {
                                "messageId": "1037425364332843009",
                                "userId": "1037425458566270978",
                                "guildId": "1443286926592204800",
                                "channelId": "1443286926592204815",
                                "content": {
                                    "content": "[some offensive message here]",
                                },
                            }`
                        },
                    ]
                },
                {
                    role: 'model',
                    parts: [
                        {
                            text: '[{ "messageId": "1037425364332843009", "score": 1 }, { "messageId": "1037425364332843009", "score": -1, "reason": "[the reason why the message is negative]" }]'
                        }
                    ]
                },
                {
                    role: 'user',
                    parts: [
                        { text: 'Please evaluate the following messages:' },
                        {
                            text: messages.map(message => JSON.stringify({
                                messageId: message.id,
                                userId: message.userId,
                                guildId: message.guildId,
                                channelId: message.channelId,
                                content: message.content,
                            })).join('\n')
                        }
                    ]
                }
            ]

            try {

                const result = await this.model.generateContent({
                    contents,
                    generationConfig,
                    safetySettings,
                    // tools: [
                    //     {
                    //         functionDeclarations: [
                    //             // {
                    //             //         name: 'evaluateMessages',
                    //             //         description: 'Saves the score for an array of messages',
                    //             //         parameters: {
                    //             //                 type: FunctionDeclarationSchemaType.ARRAY,
                    //             //                 description: 'The messages to be evaluated',
                    //             //                 properties: {
                    //             //                         messageId: {
                    //             //                                 type: FunctionDeclarationSchemaType.STRING,
                    //             //                                 properties: {}
                    //             //                             },
                    //             //                             score: {
                    //             //                                     type: FunctionDeclarationSchemaType.INTEGER,
                    //             //                 properties: {}
                    //             //             },
                    //             //             // reason: {
                    //             //                 //     type: FunctionDeclarationSchemaType.STRING,
                    //             //             //     properties: {}
                    //             //             // }
                    //             //         }
                    //             //     }
                    //             // },

                    //             // {
                    //             //     name: 'evaluateMessages',
                    //             //     description: 'Saves the score for an array of messages',
                    //             //     parameters: {
                    //             //         type: FunctionDeclarationSchemaType.OBJECT,
                    //             //         properties: {
                    //             //             messages: {
                    //             //                 type: FunctionDeclarationSchemaType.ARRAY,
                    //             //                 description: 'The messages to be evaluated',
                    //             //                 // required: ['messageId', 'score'],
                    //             //                 properties: {
                    //             //                     messageId: {
                    //             //                         type: FunctionDeclarationSchemaType.STRING,
                    //             //                         properties: {}
                    //             //                     },
                    //             //                     score: {
                    //             //                         type: FunctionDeclarationSchemaType.INTEGER,
                    //             //                         properties: {}
                    //             //                     },
                    //             //                     // reason: {
                    //             //                     //     type: FunctionDeclarationSchemaType.STRING,
                    //             //                     //     properties: {}
                    //             //                     // }
                    //             //                 }
                    //             //             }
                    //             //         }
                    //             //     }
                    //             // },

                    //             // {
                    //             //     name: 'evaluateMessages',
                    //             //     description: 'Saves the score for an array of messages',
                    //             //     parameters: {
                    //             //         type: FunctionDeclarationSchemaType.OBJECT,
                    //             //         description: 'The messages to be evaluated',
                    //             //         properties: messages.reduce((acc, message) => {
                    //             //             acc[message.id] = {
                    //             //                 type: FunctionDeclarationSchemaType.OBJECT,
                    //             //                 properties: {
                    //             //                     // messageId: {
                    //             //                     //     type: FunctionDeclarationSchemaType.STRING,
                    //             //                     //     properties: {}
                    //             //                     // },
                    //             //                     score: {
                    //             //                         type: FunctionDeclarationSchemaType.INTEGER,
                    //             //                         properties: {}
                    //             //                     }
                    //             //                 }
                    //             //             }
                    //             //             return acc
                    //             //         }, {} as Record<string, FunctionDeclarationSchemaProperty>)
                    //             //     }
                    //             // },
                    //         ]
                    //     }
                    // ]
                })

                // console.log('function calls:', result.response.functionCalls())

                console.log('response text:', result.response.text())

                contents.push({
                    role: 'model',
                    parts: [
                        { text: result.response.text() }
                    ]
                })

                const parsedResponse = JSON.parse(result.response.text())
                console.log(parsedResponse)
                // if (!parsedResponse || !Array.isArray(parsedResponse))
                //     throw new Error('The object must be an array')

                const finalResult = zod.array(zod.object({
                    messageId: zod.string({ required_error: 'The message id is required' }),
                    score: zod
                        .number({ required_error: 'The score is required' })
                        .min(minScore, { message: `The score must be greater than or equal to ${minScore}` })
                        .max(maxScore, { message: `The score must be less than or equal to ${maxScore}` }),
                    reason: zod.string().optional().nullable()
                }), { invalid_type_error: 'The object must be an array' }).parse(parsedResponse)

                // response = finalResult

                return finalResult
            } catch (error) {
                let message = error.message || ''

                if (error instanceof ZodError)
                    message = error.errors.map(err => err.message).join('\n')

                contents.push({
                    role: 'user', parts: [
                        { text: `Invalid response, please try again. ${error.message || ''}` }
                    ]
                })
                console.log(error)
            }
        }


        // const content = await model.generateContent({
        //     contents: [{
        //         parts: events.map(event => this.toModelMessage(event)).map(part => ({ text: part.content + '\n' } as Part)),
        //         role: 'user'
        //     }],
        //     generationConfig,
        //     safetySettings,
        //     tools: [{
        //         functionDeclarations: Array
        //             .from(context.moduleManager.actions.values())
        //             .map(action => this.actionToFunctionDeclaration(action.name, action)),
        //     }]
        // })
    }
}

export default Gemini

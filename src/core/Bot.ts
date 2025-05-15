import Discord, { GuildMember, User } from 'discord.js'
import { UserRole } from '../models/GuildMember'
import { getUsersRepository } from '../repositories/GuildMembersRepository'
import { getGuildsRepository } from '../repositories/GuildsRepository'
import { Guild } from '../models/Guild'
import MessageScore from '../models/MessageScore'
import dataSource from '../../dataSource'
import getMessageScoresRepository from '../repositories/MessageScoresRepository'

interface GetUserScoreContext {
    requestedBy: GuildMember
}

interface GetUserHistoryContext {
    requestedBy: GuildMember
    page: number
    pageSize: number
    global?: boolean
}

export class UserNotFoundError extends Error {
    constructor() {
        super('User not found')
    }
}

class Bot {
    
    async saveUserData(member: GuildMember, userData?: { role?: UserRole }) {

        try {

            const repository = getUsersRepository()

            const user = repository.create({
                id: member.id,
                guildId: member.guild.id,
                name: member.displayName || member.nickname || member.user.displayName,
                role: userData?.role
            })

            const newUser = await repository.save(user)

            return newUser
        } catch (error) {
            throw error
        }
    }

    async registerGuild(guild: Discord.Guild) {

        try {
            const repository = getGuildsRepository()
            
            const newGuild = {
                id: guild.id
            } as Guild

            const result = await repository.save(newGuild)

            return result

        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async removeGuild(guildId: string) {
        try {
            const repository = getGuildsRepository()

            await repository.delete(guildId)
            return
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async saveMessageScores(messages: MessageScore[]) {

        const queryRunner = dataSource.createQueryRunner()

        try {

            // Calculate user scores
            const userScores = messages.reduce((acc, curr) => {
                const user = acc.find(u => u.id === curr.userId)

                if (user) {
                    user.score += curr.score
                } else {
                    acc.push({
                        id: curr.userId,
                        guildId: curr.guildId,
                        score: curr.score
                    })
                }

                return acc
            }, [] as { id: string, score: number, guildId: string }[])


            await queryRunner.startTransaction()

            // Increment user scores
            const userRepository = getUsersRepository(queryRunner.manager)
            await Promise.all(userScores.map(async user => {
                await userRepository.increment({ id: user.id, guildId: user.guildId }, 'score', user.score)
            }))

            // Save message scores
            const messageScoreRepository = getMessageScoresRepository(queryRunner.manager)

            const negativeMessages = messages.filter(m => m.score < 0)

            const messageScores = messageScoreRepository.create(negativeMessages)
            await messageScoreRepository.save(messageScores)

            await queryRunner.commitTransaction()
        } catch (error) {
            console.log(error)
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    async getUserScore(userId: string, guildId: string | undefined, context: GetUserScoreContext) {

        const repository = getUsersRepository()

        const guildMember = await repository.findOne({ where: { id: userId, guildId } })

        if (!guildMember)
            throw new UserNotFoundError()

        if (context.requestedBy.id !== userId)
            return { userId, score: guildMember.score, globalScore: null }

        const globalScore = await repository.sum('score', { id: userId })

        return {
            userId,
            score: guildMember.score,
            globalScore: globalScore
        }

    }

    async getUserHistory(userId: string, guildId: string, context: GetUserHistoryContext) {
    
        const { requestedBy, page, pageSize, global } = context

        const repository = getMessageScoresRepository()

        const [messages, totalCount] = await repository.findAndCount({
            where: { userId, guildId: context.global ? undefined : guildId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        return {
            totalPages: Math.ceil(totalCount / pageSize),
            count: messages.length,
            messages
        }
    }

    async getLeaderboard(guildId: string, page: number, pageSize: number) {

        const repository = getUsersRepository()

        const [results, totalCount] = await repository.findAndCount({
            where: { guildId },
            order: { score: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        return {
            totalPages: Math.ceil(totalCount / pageSize),
            totalResults: totalCount,
            count: results.length,
            results
        }
    }

}

const bot = new Bot()

export default bot

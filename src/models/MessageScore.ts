import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('message_scores')
class MessageScore {
    @PrimaryColumn() messageId: string
    @Column() userId: string
    @Column() guildId: string
    @Column() channelId: string
    @Column() score: number
    @Column() reason: string
    @CreateDateColumn() createdAt: Date
}

export default MessageScore

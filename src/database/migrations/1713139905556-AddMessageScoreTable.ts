import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class AddMessageScoreTable1713139905556 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'message_scores',
                columns: [
                    { name: 'messageId', type: 'varchar', isPrimary: true },
                    { name: 'userId', type: 'varchar', isNullable: false },
                    { name: 'guildId', type: 'varchar', isNullable: false },
                    { name: 'channelId', type: 'varchar', isNullable: false },
                    { name: 'score', type: 'integer', default: 0 },
                    { name: 'reason', type: 'varchar', isNullable: true },
                    { name: 'createdAt', type: 'timestamp', default: 'now()' },
                ],
                foreignKeys: [
                    {
                        name: 'FK_message_scores_users',
                        columnNames: ['userId', 'guildId'],
                        referencedColumnNames: ['id', 'guildId'],
                        referencedTableName: 'guild_members',
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    }
                ]
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('message_scores')
    }

}

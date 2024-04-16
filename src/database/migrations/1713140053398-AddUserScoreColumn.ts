import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddUserScoreColumn1713140053398 implements MigrationInterface {

    private readonly column = new TableColumn({
        name: 'score',
        type: 'integer',
        default: 0
    })

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('guild_members', this.column)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('guild_members', this.column)
    }

}

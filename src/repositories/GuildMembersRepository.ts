import { EntityManager } from 'typeorm'
import dataSource from '../../dataSource'
import { User } from '../models/GuildMember'

function getUsersRepository(manager: EntityManager = dataSource.manager) {
    return manager.getRepository(User)
}

export { getUsersRepository }

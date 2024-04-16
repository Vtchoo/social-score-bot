import { EntityManager } from 'typeorm'
import dataSource from '../../dataSource'
import MessageScore from '../models/MessageScore'

function getMessageScoresRepository(manager: EntityManager = dataSource.manager) {
    return manager.getRepository(MessageScore)
}

export default getMessageScoresRepository

import express from 'express'
import { AgencyController } from './agency.controller'
import { TopicsController } from '../topics/topics.controller'
import { query, param } from 'express-validator'

export const routeAgencies = ({
  controller,
  topicsController,
}: {
  controller: AgencyController
  topicsController: TopicsController
}): express.Router => {
  const router = express.Router()

  /**
   * Find an agency by their shortname or longname
   * @route  GET /api/agencies?<params>
   * @return 200 with agency
   * @return 404 if agency is not found
   * @return 500 if database error
   * @access Public
   */
  router.get(
    '/',
    [query('shortname').optional(), query('longname').optional()],
    controller.getSingleAgency,
  )

  /**
   * Find an agency by their id
   * @route  GET /api/agencies/:agencyId
   * @return 200 with agency
   * @return 404 if agency is not found
   * @return 500 if database error
   * @access Public
   */
  router.get('/:agencyId', controller.getSingleAgencyById)

  /**
   * Lists all topics corresponding to an agency
   * @route   GET /api/agencies/:agencyId/topics
   * @returns 200 with list of nested topics
   * @returns 400 with database error
   */
  router.get(
    '/:agencyId/topics',
    param('agencyId').isInt().toInt(),
    topicsController.listTopicsUsedByAgency,
  )

  return router
}

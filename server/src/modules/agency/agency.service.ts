import { ModelDef } from '../../types/sequelize'
import { Agency } from '~shared/types/base'
import { AgencyQuery } from '../../types/agency-type'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { createLogger } from '../../bootstrap/logging'
import { MissingAgencyError } from './agency.errors'
import { DatabaseError } from '../core/core.errors'

const logger = createLogger(module)
export class AgencyService {
  private Agency: ModelDef<Agency>

  constructor({ Agency }: { Agency: ModelDef<Agency> }) {
    this.Agency = Agency
  }

  /**
   * Find an agency by their shortname or longname
   * @param query agency's shortname or longname
   * @returns ok(agency) if retrieval is successful
   * @returns err(DatabaseError) if database errors occurs whilst retrieving agency
   * @returns err(MissingAgencyError) if agency does not exist in the database
   */
  findOneByName = (
    query: AgencyQuery,
  ): ResultAsync<Agency, DatabaseError | MissingAgencyError> => {
    return ResultAsync.fromPromise(
      this.Agency.findOne({
        where: query,
      }),
      (error) => {
        logger.error({
          message: 'Database error while retrieving single agency by name',
          meta: {
            function: 'findOneByName',
            ...query,
          },
          error,
        })
        return new DatabaseError()
      },
    ).andThen((agency) => {
      if (!agency) {
        return errAsync(new MissingAgencyError())
      }
      return okAsync(agency)
    })
  }

  /**
   * Find an agency by their id
   * tried integrating into one function but params can't tell
   * the diff between string or number
   * @param agencyId Agency's id
   * @returns ok(agency) if retrieval is successful
   * @returns err(DatabaseError) if database errors occurs whilst retrieving agency
   * @returns err(MissingAgencyError) if agency does not exist in the database
   */
  findOneById = (
    agencyId: number,
  ): ResultAsync<Agency, DatabaseError | MissingAgencyError> => {
    return ResultAsync.fromPromise(
      this.Agency.findOne({
        where: { id: agencyId },
      }),
      (error) => {
        logger.error({
          message: 'Database error while retrieving single agency by id',
          meta: {
            function: 'findOneById',
            agencyId,
          },
          error,
        })
        return new DatabaseError()
      },
    ).andThen((agency) => {
      if (!agency) {
        return errAsync(new MissingAgencyError())
      }
      return okAsync(agency)
    })
  }

  listAgencyShortnames = (): ResultAsync<
    { shortname: string }[],
    DatabaseError
  > => {
    return ResultAsync.fromPromise(
      this.Agency.findAll({ attributes: ['shortname'] }),
      (error) => {
        logger.error({
          message: 'Database error while retrieving all agency shortnames',
          meta: {
            function: 'listAgencyShortnames',
          },
          error,
        })
        return new DatabaseError()
      },
    ).andThen((agencyShortnames) => {
      if (!agencyShortnames) {
        return errAsync(new MissingAgencyError())
      }
      return okAsync(agencyShortnames)
    })
  }
}

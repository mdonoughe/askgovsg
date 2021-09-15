import { z } from 'zod'
import { BaseModel } from './common'

export const Agency = BaseModel.extend({
  shortname: z.string(),
  longname: z.string(),
  email: z.string(),
  logo: z.string(),
})

export type Agency = z.infer<typeof Agency>
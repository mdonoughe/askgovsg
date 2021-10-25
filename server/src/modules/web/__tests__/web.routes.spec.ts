import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { Model, ModelCtor, Sequelize } from 'sequelize'
import supertest from 'supertest'
import {
  Agency as AgencyType,
  Post as PostType,
  PostStatus,
  Tag as TagType,
} from '~shared/types/base'
import {
  Answer as AnswerModel,
  PostTag as PostTagType,
  User as UserModel,
} from '../../../models'
import { PostCreation } from '../../../models/posts.model'
import { ModelDef } from '../../../types/sequelize'
import { createTestDatabase, getModel, ModelName } from '../../../util/jest-db'
import { AgencyService } from '../../agency/agency.service'
import { AnswersService } from '../../answers/answers.service'
import { PostService } from '../../post/post.service'
import { WebController } from '../web.controller'
import { routeWeb } from '../web.routes'
import { WebService } from '../web.service'

describe('/', () => {
  const indexStr =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.ico"><link rel="icon" type="image/svg+xml" href="/icon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" media="(prefers-color-scheme: light)" content="white"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="black"><title>AskGov</title><meta name="description" content="Answers from the Singapore Government" data-rh="true"><meta property="og:title" content="AskGov"><meta property="og:description" content="Answers from the Singapore Government"><meta property="og:image" content="/logo512.png"><meta property="og:type" content="website"><link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&amp;display=swap" rel="preload stylesheet" as="style" crossorigin="anonymous"><link href="/static/css/2.8e4e8e1f.chunk.css" rel="stylesheet"><link href="/static/css/main.3762428d.chunk.css" rel="stylesheet"></head><body><div id="root"></div><script src="/static/js/runtime-main.7545a8a1.js"></script><script src="/static/js/2.aea750b1.chunk.js"></script><script src="/static/js/main.c22b20af.chunk.js"></script></body></html>'
  const index = Buffer.from(indexStr)

  let db: Sequelize

  const mockAgencies: AgencyType[] = []
  const mockPosts: PostType[] = []

  // let Post: ModelCtor<PostType & Model>
  let Post: ModelDef<PostType, PostCreation>
  let Agency: ModelCtor<AgencyType & Model>
  let User: ModelCtor<UserModel>
  let Answer: ModelCtor<AnswerModel>
  // let PostTag: ModelCtor<PostTagType & Model>
  let PostTag: ModelDef<PostTagType>
  let Tag: ModelCtor<TagType & Model>

  let webController: WebController

  beforeAll(async () => {
    db = await createTestDatabase()
    Post = getModel<PostType & Model>(db, ModelName.Post)
    Agency = getModel<AgencyType & Model>(db, ModelName.Agency)
    User = getModel<UserModel>(db, ModelName.User)
    Answer = getModel<AnswerModel>(db, ModelName.Answer)
    PostTag = getModel<PostTagType & Model>(db, ModelName.PostTag)
    Tag = getModel<TagType & Model>(db, ModelName.Tag)

    for (let i = 1; i < 3; i++) {
      const mockAgency = await Agency.create({
        shortname: `shortname${i}`,
        longname: `longname${i}`,
        email: `enquiries${i}@ask.gov.sg`,
        logo: 'https://logos.ask.gov.sg/askgov-logo.svg',
        noEnquiriesMessage: null,
        website: null,
        displayOrder: null,
      })
      mockAgencies.push(mockAgency)
      const mockUser = await User.create({
        username: `answerer${i}@test.gov.sg`,
        displayname: `answerer${i}`,
        agencyId: mockAgency.id,
      })
      const mockPost = await Post.create({
        title: i.toString(),
        description: '',
        status: PostStatus.Public,
        userId: mockUser.id,
        agencyId: mockAgency.id,
      })
      mockPosts.push(mockPost)
      await Answer.create({
        body: `<p>This is an answer to post ${mockPost.id}.</p>`,
        username: 'username',
        userId: mockUser.id,
        agencyLogo: 'logo.svg',
        postId: mockPost.id,
      })
    }
    webController = new WebController({
      agencyService: new AgencyService({ Agency }),
      answersService: new AnswersService(),
      postService: new PostService({ Answer, Post, PostTag, Tag, User }),
      webService: new WebService(),
      index,
    })
  })

  afterAll(async () => {
    await db.close()
  })

  describe('/agency/:shortname', () => {
    it('returns agency index file', async () => {
      const agencyPageIndex = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.ico"><link rel="icon" type="image/svg+xml" href="/icon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" media="(prefers-color-scheme: light)" content="white"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="black"><title>${mockAgencies[0].shortname.toUpperCase()} FAQ - AskGov</title><meta name="description" content="Answers from ${
        mockAgencies[0].longname
      } (${mockAgencies[0].shortname.toUpperCase()})" data-rh="true"><meta property="og:title" content="${mockAgencies[0].shortname.toUpperCase()} FAQ - AskGov"><meta property="og:description" content="Answers from ${
        mockAgencies[0].longname
      } (${mockAgencies[0].shortname.toUpperCase()})"><meta property="og:image" content="/logo512.png"><meta property="og:type" content="website"><link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&amp;display=swap" rel="preload stylesheet" as="style" crossorigin="anonymous"><link href="/static/css/2.8e4e8e1f.chunk.css" rel="stylesheet"><link href="/static/css/main.3762428d.chunk.css" rel="stylesheet"></head><body><div id="root"></div><script src="/static/js/runtime-main.7545a8a1.js"></script><script src="/static/js/2.aea750b1.chunk.js"></script><script src="/static/js/main.c22b20af.chunk.js"></script></body></html>`

      const app = express()
      app.use('/', routeWeb({ controller: webController }))
      const request = supertest(app)

      const response = await request.get(`/agency/${mockAgencies[0].shortname}`)

      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.text).toEqual(agencyPageIndex)
    })

    it('redirects user to /not-found when shortname is not valid', async () => {
      const app = express()
      app.use('/', routeWeb({ controller: webController }))
      const request = supertest(app)

      const response = await request.get(`/agency/phony`)

      expect(response.status).toEqual(StatusCodes.MOVED_PERMANENTLY)
      expect(response.text).toEqual(
        'Moved Permanently. Redirecting to /not-found',
      )
      expect(response.header.location).toEqual('/not-found')
    })
  })

  describe('/questions/:id', () => {
    // TODO: uncomment and fix test when AnswersService has been refactored to use dependency injection
    // it('returns question page index file when id is a number', async () => {
    //   const sanitisedDescription = 'This is an answer to the question.'
    //   const getQuestionPageIndex = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/favicon.ico"><link rel="icon" type="image/svg+xml" href="/icon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" media="(prefers-color-scheme: light)" content="white"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="black"><title>${mockPosts[0].title} - AskGov</title><meta name="description" content="${sanitisedDescription}" data-rh="true"><meta property="og:title" content="${mockPosts[0].title} - AskGov"><meta property="og:description" content="${sanitisedDescription}"><meta property="og:image" content="/logo512.png"><meta property="og:type" content="website"><link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&amp;display=swap" rel="preload stylesheet" as="style" crossorigin="anonymous"><link href="/static/css/2.8e4e8e1f.chunk.css" rel="stylesheet"><link href="/static/css/main.3762428d.chunk.css" rel="stylesheet"></head><body><div id="root"></div><script src="/static/js/runtime-main.7545a8a1.js"></script><script src="/static/js/2.aea750b1.chunk.js"></script><script src="/static/js/main.c22b20af.chunk.js"></script></body></html>`

    //   const app = express()
    //   app.use('/', routeWeb({ controller: webController }))
    //   const request = supertest(app)

    //   const response = await request.get(`/questions/${mockPosts[0].id}`)

    //   expect(JSON.stringify(response)).toEqual('')
    //   expect(response.status).toEqual(StatusCodes.OK)
    //   expect(response.text).toStrictEqual(getQuestionPageIndex)
    // })

    it('returns BAD REQUEST when id is not a number', async () => {
      const app = express()
      app.use('/', routeWeb({ controller: webController }))
      const request = supertest(app)

      const response = await request.get(`/questions/not`)

      expect(response.status).toEqual(StatusCodes.BAD_REQUEST)
    })
  })

  describe('/sitemap.xml', () => {
    // TODO: uncomment and fix test when AnswersService has been refactored to use dependency injection
    // const lastModStr = new Date().toISOString().split('T')[0]
    // it('returns sitemap file', async () => {
    //   const expectedSitemap = `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://ask.gov.sg/</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/terms</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/privacy</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/questions/1</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/questions/2</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/agency/shortname1</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n  <url>\n    <loc>https://ask.gov.sg/agency/shortname2</loc>\n    <lastmod>${lastModStr}</lastmod>\n  </url>\n</urlset>`
    //   const app = express()
    //   app.use('/', routeWeb({ controller: webController }))
    //   const request = supertest(app)
    //   const response = await request.get('/sitemap.xml')
    //   expect(response.status).toEqual(StatusCodes.OK)
    //   expect(response.text).toEqual(expectedSitemap)
    // })
  })
})

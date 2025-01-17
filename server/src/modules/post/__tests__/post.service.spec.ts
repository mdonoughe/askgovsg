import { ModelCtor, Sequelize } from 'sequelize/types'
import {
  Answer as AnswerModel,
  Tag as TagModel,
  PostTag,
  User as UserModel,
  Permission as PermissionModel,
} from '../../../models'
import {
  Agency,
  PermissionType,
  Post,
  PostStatus,
  TagType,
  Topic,
} from '~shared/types/base'
import { SortType } from '../../../types/sort-type'
import {
  createTestDatabase,
  getModel,
  getModelDef,
  ModelName,
} from '../../../util/jest-db'
import { PostService } from '../post.service'
import { ModelDef } from '../../../types/sequelize'
import { PostCreation } from '../../../models/posts.model'
import {
  InvalidTagsError,
  InvalidTopicsError,
  MissingPublicPostError,
  MissingUserIdError,
  PostUpdateError,
  TagDoesNotExistError,
  TopicDoesNotExistError,
  InvalidTagsAndTopicsError,
} from '../post.errors'

describe('PostService', () => {
  let db: Sequelize
  let Agency: ModelDef<Agency>
  let Answer: ModelCtor<AnswerModel>
  let Post: ModelDef<Post, PostCreation>
  let PostTag: ModelDef<PostTag>
  let Tag: ModelCtor<TagModel>
  let User: ModelCtor<UserModel>
  let Permission: ModelCtor<PermissionModel>
  let Topic: ModelDef<Topic>
  let postService: PostService
  const mockPosts: Post[] = []
  let mockUser: UserModel
  let mockTag: TagModel
  let mockTopic: Topic
  let mockAgency: Agency

  beforeAll(async () => {
    db = await createTestDatabase()
    Agency = getModelDef<Agency>(db, ModelName.Agency)
    Answer = getModel<AnswerModel>(db, ModelName.Answer)
    Post = getModelDef<Post, PostCreation>(db, ModelName.Post)
    PostTag = getModelDef<PostTag>(db, ModelName.PostTag)
    Tag = getModel<TagModel>(db, ModelName.Tag)
    User = getModel<UserModel>(db, ModelName.User)
    Permission = getModel<PermissionModel>(db, ModelName.Permission)
    Topic = getModelDef<Topic>(db, ModelName.Topic)
    postService = new PostService({
      Answer,
      Post,
      PostTag,
      Tag,
      User,
      Topic,
      Agency,
    })
    mockAgency = await Agency.create({
      shortname: 'was',
      longname: 'Work Allocation Singapore',
      email: 'enquiries@was.gov.sg',
      website: null,
      noEnquiriesMessage: null,
      logo: 'https://logos.ask.gov.sg/askgov-logo.svg',
      displayOrder: [],
    })
    mockUser = await User.create({
      username: 'answerer@test.gov.sg',
      displayname: '',
      agencyId: mockAgency.id,
    })
    mockTag = await Tag.create({
      tagname: 'test',
      description: '',
      link: '',
      hasPilot: true,
      tagType: TagType.Topic,
    })
    mockTopic = await Topic.create({
      name: 'mock',
      description: '',
      agencyId: mockUser.agencyId,
      parentId: null,
    })
    for (let title = 1; title <= 20; title++) {
      const mockPost = await Post.create({
        title: title.toString(),
        description: null,
        status: PostStatus.Public,
        userId: mockUser.id,
        agencyId: mockUser.agencyId,
        topicId: mockTopic.id,
      })
      mockPosts.push(mockPost)
      await PostTag.create({ postId: mockPost.id, tagId: mockTag.id })
    }
    await Permission.create({
      userId: mockUser.id,
      tagId: mockTag.id,
      role: PermissionType.Answerer,
    })
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await db.close()
  })

  describe('listPosts', () => {
    it('should return all data with no page query', async () => {
      // Act
      const result = await postService.listPosts({
        sort: SortType.Top,
        tags: [mockTag.tagname],
        agencyId: mockAgency.id,
        topics: [mockTopic.name],
      })

      // Assert
      expect(result.posts.length).toStrictEqual(mockPosts.length)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
    })

    it('should return all data with no tags query', async () => {
      // Act
      const result = await postService.listPosts({
        sort: SortType.Top,
        agencyId: mockAgency.id,
        topics: [mockTopic.name],
      })

      // Assert
      expect(result.posts.length).toStrictEqual(mockPosts.length)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
    })

    it('should return all data with no topics query', async () => {
      // Act
      const result = await postService.listPosts({
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname],
      })

      // Assert
      expect(result.posts.length).toStrictEqual(mockPosts.length)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
    })

    it('should return first 10 posts with query on page 1, size 10', async () => {
      // Act
      const result = await postService.listPosts({
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname],
        topics: [mockTopic.name],
        page: 1,
        size: 10,
      })
      // Assert
      expect(result.posts.length).toStrictEqual(10)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
      expect(result.posts[0].title).toBe(mockPosts[0].title)
      expect(result.posts[9].title).toBe(mockPosts[9].title)
    })

    it('should return 11-15th posts with query on page 3, size 5', async () => {
      // Act
      const result = await postService.listPosts({
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname],
        topics: [mockTopic.name],
        page: 3,
        size: 5,
      })
      // Assert
      expect(result.posts.length).toStrictEqual(5)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
      expect(result.posts[0].title).toStrictEqual(mockPosts[10].title)
      expect(result.posts[4].title).toStrictEqual(mockPosts[14].title)
    })

    it('should return error when invalid tags exist in query', async () => {
      const badTagRequest = {
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname, 'badtag'],
        topics: [mockTopic.name],
      }
      await expect(postService.listPosts(badTagRequest)).rejects.toStrictEqual(
        new InvalidTagsError(),
      )
    })

    it('should return error when invalid topics exist in query', async () => {
      const badTagRequest = {
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname],
        topics: [mockTopic.name, 'badtopic'],
      }
      await expect(postService.listPosts(badTagRequest)).rejects.toStrictEqual(
        new InvalidTopicsError(),
      )
    })
  })

  describe('listAnswerablePosts', () => {
    it('should return error when the user ID is invalid', async () => {
      try {
        await postService.listAnswerablePosts({
          userId: mockUser.id + 10,
          sort: SortType.Top,
          withAnswers: false,
        })
        // Act
        throw new Error('Test was force-failed')
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message).toBe('Unable to find user with given ID')
        }
      }
    })

    it('should return all data with no page query', async () => {
      // Act
      const result = await postService.listAnswerablePosts({
        userId: mockUser.id,
        sort: SortType.Top,
        withAnswers: false,
      })

      // Assert
      expect(result.posts.length).toStrictEqual(mockPosts.length)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
    })

    it('should return 4-6th posts with query on page 2, size 3', async () => {
      // Act
      const result = await postService.listAnswerablePosts({
        userId: mockUser.id,
        sort: SortType.Top,
        withAnswers: false,
        page: 2,
        size: 3,
      })

      // Assert
      expect(result.posts.length).toStrictEqual(3)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
      expect(result.posts[0].title).toStrictEqual(mockPosts[3].title)
      expect(result.posts[2].title).toStrictEqual(mockPosts[5].title)
    })

    it('should return 15-20th posts with query on page 2, size 15', async () => {
      // Act
      const result = await postService.listAnswerablePosts({
        userId: mockUser.id,
        sort: SortType.Top,
        withAnswers: false,
        page: 2,
        size: 15,
      })
      // Assert
      expect(result.posts.length).toStrictEqual(5)
      expect(result.totalItems).toStrictEqual(mockPosts.length)
      expect(result.posts[0].title).toStrictEqual(mockPosts[15].title)
      expect(result.posts[4].title).toStrictEqual(mockPosts[19].title)
    })

    it('should return error when invalid tags exist in query', async () => {
      const badTagRequest = {
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname, 'badtag'],
        topics: [mockTopic.name],
      }
      await expect(postService.listPosts(badTagRequest)).rejects.toStrictEqual(
        new InvalidTagsError(),
      )
    })

    it('should return error when invalid topics exist in query', async () => {
      const badTagRequest = {
        sort: SortType.Top,
        agencyId: mockAgency.id,
        tags: [mockTag.tagname],
        topics: [mockTopic.name, 'badtopic'],
      }
      await expect(postService.listPosts(badTagRequest)).rejects.toStrictEqual(
        new InvalidTopicsError(),
      )
    })
  })

  describe('getSinglePost', () => {
    it('gets single post with associated tags, topics, user and related posts', async () => {
      const post = await postService.getSinglePost(mockPosts[0].id)
      expect(post.title).toBe(mockPosts[0].title)
    })
    it('throws if public post does not exist', async () => {
      const badPostId = mockPosts[mockPosts.length - 1].id + 20
      await expect(postService.getSinglePost(badPostId)).rejects.toStrictEqual(
        new MissingPublicPostError(),
      )
    })
  })

  describe('createPost', () => {
    it('throws when at least one tag and topic does not exist', async () => {
      const badPost = {
        title: 'Bad',
        description: 'Bad',
        userId: mockUser.id,
        agencyId: mockUser.agencyId,
        tagname: ['badtag'],
        topicId: mockTopic.id + 20,
      }
      await expect(postService.createPost(badPost)).rejects.toStrictEqual(
        new InvalidTagsAndTopicsError(),
      )
    })
    it('throws on bad tag', async () => {
      const badTagPost = {
        title: 'Bad',
        description: 'Bad',
        userId: mockUser.id,
        agencyId: mockUser.agencyId,
        tagname: ['badtag'],
        topicId: mockTopic.id,
      }
      await expect(postService.createPost(badTagPost)).rejects.toStrictEqual(
        new TagDoesNotExistError(),
      )
    })
    it('throws on bad topic', async () => {
      const badTopicPost = {
        title: 'Bad',
        description: 'Bad',
        userId: mockUser.id,
        agencyId: mockUser.agencyId,
        tagname: [mockTag.tagname],
        topicId: mockTopic.id + 20,
      }
      await expect(postService.createPost(badTopicPost)).rejects.toStrictEqual(
        new TopicDoesNotExistError(),
      )
    })
    it('creates post on good input', async () => {
      const postParams = {
        title: 'Title',
        description: 'Description',
        userId: mockUser.id,
        agencyId: mockUser.agencyId,
        tagname: [mockTag.tagname],
        topicId: mockTopic.id,
      }

      const postId = await postService.createPost(postParams)

      const post = await Post.findByPk(postId)
      const postTags = await PostTag.findAll({ where: { postId } })
      expect(post).toBeDefined()
      expect(postTags.length).toBe(postParams.tagname.length)
    })
  })

  describe('deletePost', () => {
    it('throws when post deletion fails', async () => {
      const postId = mockPosts[mockPosts.length - 1].id + 20
      try {
        await postService.deletePost(postId)
        throw new PostUpdateError()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message).toBe('Post update failed')
        }
      }
    })
    it('archives post successfully', async () => {
      const postId = mockPosts[0].id
      const postUpdateStatus = await postService.deletePost(postId)
      expect(postUpdateStatus).toBeUndefined()
    })
  })

  describe('updatePost', () => {
    it('throws when at least one valid tag or topic does not exist', async () => {
      const badPost = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: ['badtag'],
        topicId: mockTopic.id + 20,
        description: '',
        title: 'title',
      }
      await expect(postService.updatePost(badPost)).rejects.toStrictEqual(
        new InvalidTagsAndTopicsError(),
      )
    })
    it('throws on bad tag', async () => {
      const badTagPost = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: ['badtag'],
        topicId: mockTopic.id,
        description: '',
        title: 'title',
      }
      await expect(postService.updatePost(badTagPost)).rejects.toStrictEqual(
        new TagDoesNotExistError(),
      )
    })
    it('throws on bad topic', async () => {
      const badTopicPost = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: [mockTag.tagname],
        topicId: mockTopic.id + 20,
        description: '',
        title: 'title',
      }

      await expect(postService.updatePost(badTopicPost)).rejects.toStrictEqual(
        new TopicDoesNotExistError(),
      )
    })

    it('updates post on good tag input, no topic', async () => {
      const postParams = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: [mockTag.tagname],
        topicId: null,
        description: 'new description',
        title: 'new title',
      }

      const postUpdateStatus = await postService.updatePost(postParams)
      expect(postUpdateStatus).toBeTruthy()
    })

    it('updates post on good topic input, no tag', async () => {
      const postParams = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: [],
        topicId: mockTopic.id,
        description: 'new description',
        title: 'new title',
      }

      const postUpdateStatus = await postService.updatePost(postParams)
      expect(postUpdateStatus).toBeTruthy()
    })

    it('updates post on good input - valid tag and topic', async () => {
      const postParams = {
        id: mockPosts[0].id,
        userid: mockUser.id,
        tagname: [mockTag.tagname],
        topicId: mockTopic.id,
        description: 'new description',
        title: 'new title',
      }

      const postUpdateStatus = await postService.updatePost(postParams)
      expect(postUpdateStatus).toBeTruthy()
    })
  })
})

import { gql } from 'apollo-server-express'
import { User } from './schema'
import { Filter, LoginPayload, AddPayload, Payload, UpdateType, UserType } from './types'

export const typeDefs = gql`
  type User {
    name: String!
    # password: String 该字段不显示和操作
    gender: Gender
    age: Int
  }

  enum Gender {
    MALE
    FEMALE
  }

  type Query {
    userList(payload: Filter): QueryResult!
    login(payload: LoginPayload!): LoginResult!
  }

  type Mutation {
    addUser(payload: AddPayload!): AddResult!
    deleteUser(name: String!): DeleteResult!
    updateUser(name: String!, payload: UpdatePayload): UpdateResult!
  }

  input Filter {
    name: String
    gender: Gender
    age: Int
  }

  type QueryResult {
    result: Boolean!
    data: [User]!
  }

  input LoginPayload {
    name: String!
    password: String!
  }

  type LoginResult {
    result: Boolean!
    data: User
  }

  input AddPayload {
    name: String!
    password: String!
    gender: Gender
    age: Int
  }

  type AddResult {
    result: Boolean!
    data: User
  }

  type DeleteResult {
    result: Boolean!
  }

  input UpdatePayload {
    name: String
    gender: Gender
    age: Int
  }

  type UpdateResult {
    result: Boolean!
    data: User
  }
`

export const resolvers = {
  Query: {
    async userList(_: unknown, { payload }: Payload<Filter>, _context: unknown) {
      // 实际上 graphql 控制了返回值，如果 QueryResult 没有定义 password，就算从数据库取出来，获取时也会报错
      const res = await User.find(payload, '-password')
      return { result: res && !!res.length, data: res }
    },
    async login(_: unknown, { payload }: Payload<LoginPayload>) {
      const res = await User.findOne(payload, '-password')
      return { result: !!res, data: res }
    },
  },
  Mutation: {
    async addUser(_: unknown, { payload }: Payload<AddPayload>) {
      const res = await User.create(payload)
      return { result: !!res, data: res }
    },
    async deleteUser(_: unknown, conditions: { name: string }) {
      const res = await User.findOneAndDelete(conditions)
      return { result: !!res }
    },
    async updateUser(_: unknown, { name, payload }: UpdateType) {
      if (!payload || !Object.keys(payload).length) return { result: false }
      const res = await User.findOneAndUpdate({ name }, payload)
      let latestUser: UserType
      if (res) {
        latestUser = await User.findOne({ name: payload.name || name }, '-password')
      }
      return { result: !!res, data: latestUser }
    },
  },
}
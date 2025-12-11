import {
  User,
  Prompt,
  Category,
  Comment,
  Like,
  Notification,
  UserRole,
  PromptType,
  Visibility,
  PromptStatus,
  NotificationType
} from '@prisma/client'

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 用户扩展类型
export type UserWithRelations = User & {
  _count?: {
    prompts?: number
    likes?: number
    followers?: number
  }
}

// 提示词扩展类型
export type PromptWithAuthor = Prompt & {
  author: User
  category?: Category | null
  _count?: {
    likes: number
    comments: number
    forks: number
  }
}

// 评论扩展类型
export type CommentWithReplies = Comment & {
  user: User
  replies?: CommentWithReplies[]
  _count?: {
    replies: number
  }
}

// 搜索参数类型
export interface SearchParams {
  q?: string
  type?: PromptType
  tags?: string[]
  category?: string
  sort?: 'latest' | 'popular' | 'trending' | 'most-forked'
  page?: number
  limit?: number
}

// 分页类型
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: Pagination
}

// 通知扩展类型
export type NotificationWithRelations = Notification & {
  data?: {
    promptId?: string
    promptTitle?: string
    userId?: string
    userName?: string
    commentId?: string
    commentContent?: string
  }
}

// 模板变量类型
export interface PromptVariable {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  required?: boolean
  options?: string[]
  placeholder?: string
  defaultValue?: string | number
}

// 创建提示词类型
export interface CreatePromptData {
  title: string
  content: string
  description?: string
  type: PromptType
  visibility: Visibility
  tags?: string[]
  variables?: PromptVariable[]
  categoryId?: string
}

// 更新提示词类型
export interface UpdatePromptData {
  title?: string
  content?: string
  description?: string
  type?: PromptType
  visibility?: Visibility
  tags?: string[]
  variables?: PromptVariable[]
  categoryId?: string
}

// 认证类型
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

// 会话类型
export interface Session {
  user: {
    id: string
    email?: string
    name?: string
    role: UserRole
    avatar?: string
  }
}
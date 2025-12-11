import { z } from "zod";

/**
 * 创建帖子的基础校验 schema
 * 用于 API 路由校验
 */
export const promptSchema = z.object({
  title: z
    .string("标题必须是字符串")
    .min(1, "标题不能为空")
    .max(100, "标题不能超过100个字符"),
  content: z.string("内容必须是字符串").min(1, "内容不能为空"),
  description: z.string("描述必须是字符串").optional(),
  type: z.string("类型必须是字符串"),
});

export type promptData = z.infer<typeof promptSchema>;

// /**
//  * 前端表单使用的扩展 schema（包含 status 和 type 字段）
//  */
// export const createPostFormSchema = createPostSchema.extend({
//   status: z.enum(["active", "hidden"]),
//   type: z.enum(["background"]),
// });

// export type CreatePostFormData = z.infer<typeof createPostFormSchema>;

// /**
//  * 更新帖子的校验 schema
//  */
// export const updatePostSchema = z.object({
//   id: z.string().min(1, "帖子ID不能为空"),
//   title: z
//     .string()
//     .min(1, "标题不能为空")
//     .max(100, "标题不能超过100个字符")
//     .optional(),
//   content: z.string().min(1, "内容不能为空").optional(),
//   description: z.string().optional(),
//   tags: z.string().optional(),
// });

// export type UpdatePostData = z.infer<typeof updatePostSchema>;

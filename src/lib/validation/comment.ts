import { z } from "zod";

/**
 * 创建评论的校验 schema
 */
export const createCommentSchema = z.object({
  content: z
    .string("内容必须是字符串")
    .min(1, "评论内容不能为空")
    .max(1000, "评论内容不能超过1000个字符"),
  postId: z.string().min(1, "帖子ID不能为空"),
  parentCommentId: z.string().optional(),
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;

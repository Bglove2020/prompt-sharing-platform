/**
 * 格式化时间为相对时间或绝对时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的时间字符串
 */
export function formatTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);

  const diffMs = now.getTime() - target.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // 今天的帖子，显示几小时前
  if (diffHours < 24 && target.getDate() === now.getDate()) {
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) {
        return '刚刚';
      }
      return `${diffMinutes}分钟前`;
    }
    return `${diffHours}小时前`;
  }

  // 昨天的帖子，显示"昨天"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (target.getDate() === yesterday.getDate() &&
      target.getMonth() === yesterday.getMonth() &&
      target.getFullYear() === yesterday.getFullYear()) {
    return '昨天';
  }

  // 其他情况显示具体日期
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const day = target.getDate();

  // 如果是同一年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }

  // 不同年份显示年份
  return `${year}年${month}月${day}日`;
}
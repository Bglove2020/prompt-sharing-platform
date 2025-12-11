/**
 * 活跃记录的哨兵时间值
 * 用于软删除机制：未删除的记录使用此值，删除时写入真实删除时间
 */
export const ACTIVE_SENTINEL = new Date("9999-12-31T23:59:59.999Z");


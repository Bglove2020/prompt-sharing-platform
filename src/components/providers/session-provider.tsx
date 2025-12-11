"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // 禁用自动轮询（因为使用 JWT，session 信息在 token 中，不需要频繁检查）
      refetchInterval={0}
      // 可选：只在窗口重新获得焦点时刷新 session（而不是定期轮询）
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
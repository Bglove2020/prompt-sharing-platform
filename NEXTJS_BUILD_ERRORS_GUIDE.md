# Next.js 构建错误知识点总结

## 一、动态服务器使用错误（Dynamic Server Usage）

### 什么情况下遇到

- API 路由使用了 `getServerSession()`、`headers()`、`cookies()` 等动态 API
- 构建时报错：`Route couldn't be rendered statically because it used 'headers'`

### 为什么会出现

- Next.js 默认尝试静态生成所有路由
- `getServerSession()` 内部调用 `headers()`，需要请求上下文
- 构建时没有请求上下文，无法执行，导致静态生成失败

### 怎么解决

在 API 路由文件顶部添加：

```tsx
export const dynamic = 'force-dynamic';
```

### 解决原理

- `dynamic = 'force-dynamic'` 明确告诉 Next.js 这是动态路由
- Next.js 不会尝试静态生成，改为每次请求时动态渲染
- 允许使用需要请求上下文的 API

---

## 二、useSearchParams() Suspense 边界错误

### 什么情况下遇到

- 页面组件直接使用 `useSearchParams()` hook
- 构建时报错：`useSearchParams() should be wrapped in a suspense boundary`

### 为什么会出现

- `useSearchParams()` 是客户端 hook，需要运行时 URL 参数
- 构建时（SSR/SSG）没有 URL 参数，无法获取值
- Next.js 要求用 Suspense 边界包裹，以处理异步渲染

### 怎么解决

将使用 `useSearchParams()` 的组件提取出来，用 `<Suspense>` 包裹：

```tsx
// 提取内部组件
function LoginForm() {
  const searchParams = useSearchParams(); // 安全使用
  // ...
}

// 用 Suspense 包裹
export default function LoginPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### 解决原理

- Suspense 告诉 Next.js 这部分需要客户端渲染
- 构建时显示 fallback，实际内容在客户端渲染
- 避免构建时访问不存在的运行时数据

---

## 三、静态生成 vs 动态渲染

### 什么情况下遇到

- 需要理解为什么某些页面可以静态生成，某些不能
- 需要优化页面性能，选择合适的渲染策略

### 为什么会出现

- Next.js 默认尝试静态生成所有页面
- 使用动态 API（`headers()`、`cookies()`、`searchParams`）会触发动态渲染
- 需要根据页面特性选择合适的策略

### 怎么解决

#### 静态生成（SSG）

```tsx
// 纯静态内容
export default function Page() {
  return <div>静态内容</div>;
}

// 服务端组件 + 数据获取
export default async function Page() {
  const data = await fetchData(); // 构建时执行
  return <div>{data}</div>;
}
```

#### 动态渲染（SSR）

```tsx
// 标记为动态
export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getServerSession(); // 需要请求上下文
  return <div>{session.user.name}</div>;
}
```

### 解决原理

- **静态生成**：构建时生成 HTML，部署后直接返回，性能最好
- **动态渲染**：每次请求时生成 HTML，可以获取实时数据
- Next.js 根据代码特征自动判断，也可手动标记

---

## 四、动态路由的静态生成

### 什么情况下遇到

- 有动态路由参数（如 `/posts/[id]`）
- 想为每个参数值预生成静态页面

### 为什么会出现

- 动态路由默认按需生成
- 需要 SEO 和首屏性能时，需要预生成

### 怎么解决

使用 `generateStaticParams` 函数：

```tsx
// 告诉 Next.js 要生成哪些参数值的页面
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { id: true },
    take: 100,
  });
  return posts.map((post) => ({ id: post.id }));
}

// 服务端组件获取数据
export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });
  return <div>{post.title}</div>;
}
```

### 解决原理

- `generateStaticParams` 在构建时执行，返回所有参数值
- Next.js 为每个参数值执行页面组件，生成静态 HTML
- 部署后直接返回预生成的 HTML，无需运行时查询

---

## 五、混合组件渲染（服务端 + 客户端）

### 什么情况下遇到

- 页面需要服务端获取数据，同时需要客户端交互
- 想兼顾 SEO 和交互体验

### 为什么会出现

- 服务端组件无法使用浏览器 API 和交互功能
- 客户端组件无法直接访问数据库或服务端 API
- 需要混合使用两种组件

### 怎么解决

服务端组件获取数据，客户端组件处理交互：

```tsx
// 服务端组件（默认）
export default async function Page() {
  const data = await fetchData(); // 构建时执行
  
  return (
    <div>
      {/* 服务端组件 - 静态内容 */}
      <PostContent data={data} />
      
      {/* 客户端组件 - 交互功能 */}
      <LikeButton postId={data.id} initialCount={data.likeCount} />
    </div>
  );
}

// 客户端组件
"use client";
export function LikeButton({ postId, initialCount }) {
  const [count, setCount] = useState(initialCount);
  // 交互逻辑...
}
```

### 解决原理

- **服务端组件**：构建时执行，生成静态 HTML，包含完整内容
- **客户端组件**：构建时也执行一次生成初始 HTML，浏览器中激活交互
- **水合（Hydration）**：React 匹配 DOM 并添加事件监听器，激活交互功能

---

## 六、核心原理总结

### Next.js 渲染流程

```
构建时（next build）
  ↓
尝试静态生成所有页面
  ↓
检测页面内容
  ↓
┌─────────────────┬─────────────────┐
│  可以静态生成    │  不能静态生成    │
│  ✅ 生成 HTML   │  ❌ 转为动态渲染 │
└─────────────────┴─────────────────┘
```

### 关键判断条件

| 特征 | 结果 |
|------|------|
| 使用 `headers()`、`cookies()` | 动态渲染 |
| 使用 `useSearchParams()`（无 Suspense） | 构建错误 |
| 使用 `useSearchParams()`（有 Suspense） | 客户端渲染 |
| 纯静态内容 | 静态生成 |
| 服务端组件 + 数据获取 | 静态生成（如果可能） |

### 最佳实践

1. **API 路由**：使用动态 API 时，添加 `dynamic = 'force-dynamic'`
2. **客户端 Hook**：使用 `useSearchParams()` 时，用 Suspense 包裹
3. **内容相对固定**：使用静态生成
4. **需要实时数据**：使用动态渲染
5. **混合模式**：服务端组件获取数据，客户端组件处理交互

---

## 七、常见错误模式

### ❌ 错误示例 1：API 路由缺少动态标记

```tsx
// src/app/api/user/posts/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions); // ❌ 缺少 dynamic 标记
  // ...
}
```

**修复**：

```tsx
export const dynamic = 'force-dynamic'; // ✅ 添加这行

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // ...
}
```

### ❌ 错误示例 2：useSearchParams 缺少 Suspense

```tsx
// src/app/login/page.tsx
export default function LoginPage() {
  const searchParams = useSearchParams(); // ❌ 缺少 Suspense
  // ...
}
```

**修复**：

```tsx
function LoginForm() {
  const searchParams = useSearchParams(); // ✅ 在 Suspense 内部使用
  // ...
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### ❌ 错误示例 3：客户端组件中使用 await

```tsx
"use client";
export default async function Page() { // ❌ 客户端组件不能是 async
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**修复**：

```tsx
// 方案 1：改为服务端组件（去掉 "use client"）
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// 方案 2：在 useEffect 中获取数据
"use client";
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  return <div>{data}</div>;
}
```

---

## 八、快速检查清单

### 构建前检查

- [ ] 所有使用 `getServerSession()` 的 API 路由是否添加了 `dynamic = 'force-dynamic'`？
- [ ] 所有使用 `useSearchParams()` 的页面是否用 Suspense 包裹？
- [ ] 是否有客户端组件标记为 `async`？
- [ ] 是否有服务端组件使用了浏览器 API？

### 性能优化检查

- [ ] 内容相对固定的页面是否使用静态生成？
- [ ] 动态路由是否使用 `generateStaticParams` 预生成？
- [ ] 是否混合使用服务端和客户端组件？

---

## 九、参考资源

- [Next.js 官方文档 - 数据获取](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js 官方文档 - 渲染](https://nextjs.org/docs/app/building-your-application/rendering)
- [Next.js 官方文档 - 路由段配置](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)

---

**最后更新**：2024年12月


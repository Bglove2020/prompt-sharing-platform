# React 水合（Hydration）知识点总结

## 一、核心概念

### 什么是水合？

**水合 = 匹配现有 DOM + 激活交互功能**

```
服务端渲染 → 生成 HTML（静态）
     ↓
浏览器显示 HTML（用户看到内容）
     ↓
JavaScript 下载完成
     ↓
React 水合 → 匹配 DOM + 添加事件监听器
     ↓
页面可交互
```

## 二、客户端组件在服务端如何渲染？

### 关键理解

**"use client" 不意味着"只在客户端执行"**

```
"use client" 的真正含义：
- ✅ 可以在客户端使用浏览器 API 和 Hooks
- ✅ 可以在服务端执行（用于生成初始 HTML）
- ❌ 但某些功能（useEffect、浏览器 API）在服务端不执行
```

### 为什么服务端也要执行客户端组件？

```
目的：生成初始 HTML，提升首屏性能

如果不执行：
  → 用户看到空白页面
  → 必须等 JavaScript 下载并执行
  → 首屏加载慢

如果执行：
  → 用户立即看到 HTML 内容
  → JavaScript 只需"激活"交互功能
  → 首屏加载快
```

### 服务端执行 vs 客户端执行的区别

```typescript
"use client";

export function Example() {
  // ✅ 服务端和客户端都执行
  const [count, setCount] = useState(0);

  // ✅ 服务端和客户端都执行
  const name = "React";

  // ❌ 服务端不执行（跳过）
  useEffect(() => {
    console.log("只在客户端执行");
  }, []);

  // ❌ 服务端报错（没有 window）
  const width = window.innerWidth;

  // ✅ 服务端和客户端都执行
  return <div>计数: {count}</div>;
}
```

### 详细执行对比

```typescript
"use client";

export function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <div>{mounted ? <p>已挂载</p> : <p>未挂载</p>}</div>;
}
```

#### 服务端执行（Node.js 环境）：

```typescript
// 服务端执行流程
function Component_Server() {
  // ✅ 执行
  const [mounted, setMounted] = useState(false); // false

  // ❌ 跳过（React 在服务端跳过 useEffect）
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ 执行，生成 JSX
  return (
    <div>
      {false ? <p>已挂载</p> : <p>未挂载</p>} // 渲染 <p>未挂载</p>
    </div>
  );
}

// 生成的 HTML
<div>
  <p>未挂载</p>
</div>;
```

#### 客户端执行（浏览器环境）：

```typescript
// 客户端执行流程
function Component_Client() {
  // ✅ 执行（初始值和服务端一致）
  const [mounted, setMounted] = useState(false); // false

  // ✅ 执行（客户端才执行 useEffect）
  useEffect(() => {
    setMounted(true); // 触发重新渲染
  }, []);

  // ✅ 执行，生成 JSX
  return (
    <div>
      {false ? <p>已挂载</p> : <p>未挂载</p>} // 初始渲染 <p>未挂载</p>
    </div>
  );

  // useEffect 执行后，重新渲染
  return (
    <div>
      {true ? <p>已挂载</p> : <p>未挂载</p>} // 更新为 <p>已挂载</p>
    </div>
  );
}
```

### 执行差异表

| 代码                         | 服务端执行 | 客户端执行 | 说明                    |
| ---------------------------- | ---------- | ---------- | ----------------------- |
| `useState(0)`                | ✅ 执行    | ✅ 执行    | 初始化状态              |
| `const x = 1`                | ✅ 执行    | ✅ 执行    | 普通变量                |
| `return <div>...</div>`      | ✅ 执行    | ✅ 执行    | 生成 JSX                |
| `useEffect(() => {...}, [])` | ❌ 跳过    | ✅ 执行    | 副作用只在客户端        |
| `window.addEventListener`    | ❌ 报错    | ✅ 执行    | 服务端没有 window       |
| `localStorage.getItem`       | ❌ 报错    | ✅ 执行    | 服务端没有 localStorage |
| `document.querySelector`     | ❌ 报错    | ✅ 执行    | 服务端没有 document     |

### 实际例子：你的 NavbarGuest

```typescript
"use client";

export function NavbarGuest() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav>
      {mounted && <Button>主题</Button>}
      <Button>登录</Button>
    </nav>
  );
}
```

#### 服务端执行：

```typescript
// 服务端 Node.js 环境
1. useState(false) → mounted = false ✅
2. useTheme() → theme 可能是 undefined ✅
3. useEffect 1 → ❌ 跳过
4. useEffect 2 → ❌ 跳过（没有 window）
5. return JSX → ✅ 执行
   - mounted = false，不渲染主题按钮
   - 渲染登录按钮

// 生成的 HTML
<nav>
  <button>登录</button>
</nav>
```

#### 客户端执行：

```typescript
// 客户端浏览器环境
1. useState(false) → mounted = false ✅（和服务端一致）
2. useTheme() → theme = "dark"（从 localStorage 读取）✅
3. useEffect 1 → ✅ 执行 → setMounted(true)
4. useEffect 2 → ✅ 执行 → 添加滚动监听
5. return JSX → ✅ 执行
   - 初始：mounted = false，不渲染主题按钮
   - 更新后：mounted = true，渲染主题按钮

// 水合时的 DOM
<nav>
  <button>登录</button>
</nav>
✅ 匹配成功！

// useEffect 执行后
<nav>
  <button>主题</button> ← 新增
  <button>登录</button>
</nav>
```

### 为什么这样设计？

```
1. 性能优化
   - 用户立即看到内容（服务端 HTML）
   - 无需等待 JavaScript 下载

2. SEO 友好
   - 搜索引擎能看到完整 HTML
   - 内容在 HTML 中，不是 JavaScript 生成

3. 渐进增强
   - 静态内容 → 交互功能
   - 即使 JavaScript 失败，也能看到内容
```

## 三、完整流程（简单示例）

### 示例 1：最简单的组件

```typescript
"use client";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>点击</button>
    </div>
  );
}
```

### 执行流程：

```
【阶段 1：服务端渲染】
1. 执行组件代码
2. useState(0) → count = 0
3. 跳过 useEffect（没有 useEffect）
4. 生成 HTML: <div><p>计数: 0</p><button>点击</button></div>

【阶段 2：浏览器接收】
- 显示 HTML（静态，按钮不可点击）

【阶段 3：水合】
1. React 执行组件代码
2. useState(0) → count = 0（和服务端一致）
3. 生成虚拟 DOM: <div><p>计数: 0</p><button>点击</button></div>
4. 匹配现有 DOM ✅
5. 添加 onClick 事件监听器
6. 水合完成

【阶段 4：用户交互】
- 点击按钮 → 触发 onClick → setCount(1) → 重新渲染
```

## 三、为什么需要一致性？

### 错误示例（不一致）：

```typescript
"use client";

export function BadComponent() {
  const [mounted, setMounted] = useState(false);
  const theme = localStorage.getItem("theme"); // ❌ 服务端没有 localStorage

  // 服务端渲染：theme = null，不渲染按钮
  // 客户端水合：theme = "dark"，渲染按钮
  // → 不匹配！

  return <div>{theme === "dark" && <button>主题按钮</button>}</div>;
}
```

### 正确示例（一致）：

```typescript
"use client";

export function GoodComponent() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    // 只在客户端执行
    setTheme(localStorage.getItem("theme"));
    setMounted(true);
  }, []);

  // 服务端和客户端初始渲染都一致：mounted = false
  return <div>{mounted && theme === "dark" && <button>主题按钮</button>}</div>;
}
```

## 四、useEffect 的执行时机

### 关键点：

```
1. 服务端渲染：useEffect 不执行
2. 水合过程：useEffect 不执行
3. 水合完成后：useEffect 才执行
```

### 示例：

```typescript
"use client";

export function Example() {
  const [count, setCount] = useState(0);

  console.log("1. 组件渲染"); // 服务端和客户端都会执行

  useEffect(() => {
    console.log("2. useEffect 执行"); // 只在客户端水合完成后执行
    setCount(1);
  }, []);

  console.log("3. 返回 JSX"); // 服务端和客户端都会执行

  return <div>{count}</div>;
}
```

### 执行顺序：

```
服务端：
  1. 组件渲染
  2. 返回 JSX
  （useEffect 不执行）

客户端水合：
  1. 组件渲染
  2. 返回 JSX
  （useEffect 不执行）

客户端水合完成后：
  1. useEffect 执行
  2. setCount(1) → 触发重新渲染
  3. 组件渲染（再次）
  4. 返回 JSX
```

## 五、mounted 检查的作用

### 问题场景：

```typescript
"use client";

export function ProblemComponent() {
  const theme = useTheme(); // 服务端：undefined，客户端："dark"

  // ❌ 服务端和客户端渲染不一致
  return <div>{theme === "dark" ? <Sun /> : <Moon />}</div>;
}
```

### 解决方案：

```typescript
"use client";

export function SolutionComponent() {
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setMounted(true); // 水合完成后才设置为 true
  }, []);

  // ✅ 服务端和客户端初始渲染一致
  if (!mounted) {
    return <div>加载中...</div>; // 或者返回占位符
  }

  // ✅ 只在客户端显示（水合完成后）
  return <div>{theme === "dark" ? <Sun /> : <Moon />}</div>;
}
```

## 六、事件监听器必须放在 useEffect

### 错误示例：

```typescript
"use client";

export function BadComponent() {
  const [scrollY, setScrollY] = useState(0);

  // ❌ 每次渲染都会执行，添加多个监听器
  window.addEventListener("scroll", () => {
    setScrollY(window.scrollY);
  });

  return <div>滚动位置: {scrollY}</div>;
}
```

### 正确示例：

```typescript
"use client";

export function GoodComponent() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // ✅ 只在组件挂载时执行一次
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // ✅ 组件卸载时清理
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // 空依赖数组，只执行一次

  return <div>滚动位置: {scrollY}</div>;
}
```

## 七、完整示例：你的 NavbarGuest

```typescript
"use client";

export function NavbarGuest() {
  // 1. 状态初始化（服务端和客户端一致）
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // 2. useEffect 1：设置 mounted（水合完成后执行）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. useEffect 2：添加滚动监听（水合完成后执行）
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 4. 渲染（服务端和客户端初始一致）
  return (
    <nav>
      <Link href="/">首页</Link>
      <div>
        {/* mounted 检查确保一致性 */}
        {mounted && (
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        )}
        <button>登录</button>
      </div>
    </nav>
  );
}
```

### 执行流程：

```
服务端渲染：
  - mounted = false
  - isScrolled = false
  - useEffect 不执行
  - 生成 HTML: <nav><a>首页</a><div><button>登录</button></div></nav>

浏览器显示：
  - 显示 HTML（静态）

水合过程：
  - mounted = false（和服务端一致）
  - isScrolled = false（和服务端一致）
  - useEffect 不执行
  - 匹配 DOM ✅
  - 添加事件监听器
  - 水合完成

水合完成后：
  - useEffect 1 执行 → setMounted(true)
  - useEffect 2 执行 → 添加滚动监听
  - 重新渲染 → 显示主题按钮
```

## 八、核心要点总结

### 1. 水合的本质

- ✅ 匹配现有 DOM
- ✅ 添加交互功能
- ❌ 不是重新渲染

### 2. 必须一致的原因

- DOM 已经存在，React 需要匹配它
- 不一致会导致错误或性能问题

### 3. useEffect 的执行时机

- 服务端：不执行
- 水合过程：不执行
- 水合完成后：执行

### 4. mounted 检查的作用

- 确保服务端和客户端初始渲染一致
- 避免水合不匹配错误

### 5. 事件监听器

- 必须放在 useEffect 里
- 需要清理函数
- 空依赖数组确保只执行一次

## 九、快速检查清单

使用客户端组件时，检查：

- [ ] 服务端和客户端初始渲染的 DOM 结构是否一致？
- [ ] 是否使用了浏览器 API（localStorage、window 等）？
  - [ ] 如果是，是否使用了 mounted 检查？
- [ ] 是否添加了事件监听器？
  - [ ] 如果是，是否放在 useEffect 里？
  - [ ] 是否有清理函数？
- [ ] useEffect 是否会在服务端执行？
  - [ ] 不会，useEffect 只在客户端执行

## 十、常见错误和解决方案

### 错误 1：直接使用 localStorage

```typescript
// ❌ 错误
const theme = localStorage.getItem("theme");

// ✅ 正确
const [theme, setTheme] = useState<string | null>(null);
useEffect(() => {
  setTheme(localStorage.getItem("theme"));
}, []);
```

### 错误 2：条件渲染不一致

```typescript
// ❌ 错误
{
  Math.random() > 0.5 && <div>随机内容</div>;
}

// ✅ 正确
const [show, setShow] = useState(false);
useEffect(() => {
  setShow(Math.random() > 0.5);
}, []);
{
  show && <div>随机内容</div>;
}
```

### 错误 3：事件监听器不在 useEffect

```typescript
// ❌ 错误
window.addEventListener("scroll", handleScroll);

// ✅ 正确
useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

---

**记住：水合 = 匹配 + 激活，不是重新渲染！**

## 项目资料

### 项目技术版本

- Next.js：14.2.x
- React：18.2.0
- TypeScript：5.4.x
- Node：18 / 20
- tailwindcss@3.4.x
- shadcn/ui
- "prisma": "^7.1.0",
- "@prisma/client": "^7.1.0"
- "@prisma/adapter-mariadb": "^7.1.0"
- nodejs 20.19.0 这里并不是只要大于 20.x 就可以，新版的 prisma 在其他版本的 nodejs 上的兼容性有点问题。

### 学习的技术内容

#### layout.tsx 与 page.tsx

layout.tsx 是包装器，page.tsx 是内容

- layout.tsx：定义共享的页面结构（如导航、侧边栏、页脚），包裹子路由。
- page.tsx：定义该路由的具体页面内容。
- 渲染时，page.tsx 的内容会作为 children 插入到 layout.tsx 中。

#### 顶部磁吸的条件

- 外部至少有一个父元素要能有滚动条。
- 要定位的元素设置 position: sticky，并通过 top、bottom 来设置定位的位置。
- 在设置这个定位后，无论这个元素是否滚动到指定的位置，触发了磁吸，它在它原本所处的文档流中占据的空间一直有效。

### Prisma 初始化流程（结合实际终端操作步骤）

1. 安装依赖  
   先在项目根目录下使用下列命令安装必要依赖：

   ```bash
   npm install prisma @prisma/client @prisma/adapter-mariadb
   ```

2. 初始化 Prisma 配置  
   通过命令生成基础配置文件和 prisma 目录（schema、.env 等）：

   ```bash
   npx prisma init
   ```

   > 注意：本项目使用了 `prisma.config.ts` 和通过环境变量管理数据库连接信息。

3. 编辑数据库模型  
   在 `prisma/schema.prisma` 中根据业务需求编写和修改数据模型。

4. 生成 Prisma 客户端代码  
   模型修改后，通过命令生成最新的客户端类型和代码（如项目中的 scripts）：

   ```bash
   npx prisma generate
   ```

5. 数据库结构同步（或迁移）  
   新增、修改模型后推送至数据库：

   ```bash
   npx prisma db push
   ```

   或开发期使用迁移来管理数据库结构变更：

   ```bash
   npx prisma migrate dev
   ```

   也可以添加一个 name 参数来命名迁移文件夹，Prisma 会用时间戳 + 你提供的名字生成迁移目录，比如 20251209131910_init/。若不写 --name，CLI 会在执行时提示你输入一个名称

   ```bash
   npx prisma migrate dev --name init
   ```

6. 适配 MariaDB 并使用 Prisma 客户端  
   以代码方式适配数据库，见本项目 `prisma/seed.ts` 用法（示例）：

   ```ts
   import { PrismaClient } from "../src/generated/prisma/client";
   import { PrismaMariaDb } from "@prisma/adapter-mariadb";

   const adapter = new PrismaMariaDb({
     host: process.env.DATABASE_HOST,
     user: process.env.DATABASE_USER,
     password: process.env.DATABASE_PASSWORD,
     database: process.env.DATABASE_NAME,
   });

   const prisma = new PrismaClient({ adapter });
   ```

7. 种子数据与开发  
   可以通过命令执行种子脚本，为数据库填充初始数据：
   ```bash
   npx prisma db seed
   ```
   成功后可以看到提示

> 参考典型开发工作流：
>
> - 编辑 schema
> - `npx prisma generate`
> - `npx prisma db push`
> - 数据脚本或业务代码中使用 `PrismaClient`

### 关于 h-full

实际上 h-full 这个类对应的 CSS 样式是 height:100% 。这表示子元素是父元素内容区域高度的 100%。

- 父元素即使有多个元素，某个子元素设置 h-full 后，这个子元素会占满全部的父元素高度，并不是占据剩余空间。
- 父元素必须有固定的高度，子元素的 h-full 才能生效。
- 父元素的盒子尺寸类型会影响子元素 h-full 的表现。当父元素的 box-sizing: content-box 时，子元素设置 h-full 会直接溢出父元素。当父元素 box-sizing: border-box 时，子元素设置 h-full 刚好占据父元素的内容区域，不会溢出。

### 关于 flex-1

|Tailwind 类|CSS 等价 |说明|
flex-1 flex: 1 1 0% 可增长、可收缩，初始为 0%
flex-auto flex: 1 1 auto 可增长、可收缩，初始为内容大小
flex-initial flex: 0 1 auto 不增长、可收缩，初始为内容大小
flex-none flex: none 不增长、不收缩，固定内容大小

默认不设置 flex 的情况下，flex 容器中的项目的 flex 属性是 flex-initial。

- 子元素全部为 flex-1 表示等分元素。
- 子元素全部为 flex-auto 表示先按内容划分，再平分剩余空间

### prisma 和 typeOrm 的差别

- 都需要定义数据库表模型，prisma 是 schema，typeOrm 是 Entity。
- prisma 定义的表不支持直接定义生成列。
- prisma 定义的表不支持直接添加数据库中的列备注。

### Next.js 的 next/image 默认只信任本域和配置过的远程域名

因此需要在 next.config.js 的 images 中声明允许的 COS 域名（如 _.cos.ap-beijing.myqcloud.com），再用 next/image 才能正常加载。
/\*\* @type {import('next').NextConfig} _/
const nextConfig = {
images: {
// 允许腾讯云 COS 下任意 bucket 的图片域名
remotePatterns: [
{
protocol: 'https',
hostname: '*.cos.ap-beijing.myqcloud.com',
pathname: '/**',
},
],
},
};

module.exports = nextConfig;

---

### 项目构造提示词补充

#### shadcn/ui 组件的使用

- 在引入 shadcn/ui 时，不要直接生成组件源码。而是使用 shadcn 的 CLI 命令（例如 pnpm dlx shadcn@latest add avatar）来添加组件。
- 在编写页面时，优先使用已有的 shadcn/ui 组件，如果所需复杂组件不存在时，可以使用 shadcn/ui 组件进行封装，构造复杂组件。除非必须情况，不要直接修改 shadcn/ui 组件的源码。

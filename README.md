# 数趣星球 · FunMath 🪐

一个**可以玩的高中数学乐园**：纯静态、零依赖、打开即玩。适合高中生自学、老师课堂演示，也可作为交互式教学网页的入门示例。

👉 **在线访问**：开启 GitHub Pages 后 `https://<你的用户名>.github.io/FunMath/`（见下方部署教程）

## ✨ 有什么？

| 站点 | 主题 | 交互实验 |
|---|---|---|
| 01 📈 | 函数 | 图像实验室（表达式输入 + 参数滑块 + 平移缩放 + 递增递减着色）、图像变换实验台 a·f(x−h)+k |
| 02 🌀 | 三角函数 | 会转的单位圆（拖拽/播放/吸附特殊角，同步扫出曲线）、波形实验室 y=A·sin(ωx+φ)+k |
| 03 🌱 | 数列 | 等差/等比生长动画（柱状图+通项公式）、斐波那契黄金螺线拼合动画 |
| 04 📐 | 导数 | 割线→切线极限动画（h→0）、导函数描迹机（拖点画 f′(x)） |
| 05 🪐 | 圆锥曲线 | 离心率变形记（e 滑块：椭圆→抛物线→双曲线）、绳索法画椭圆 |
| 06 🧊 | 立体几何 | 手写 3D 引擎：正方体/棱柱/棱锥/圆柱/圆锥/球拖拽旋转 + 欧拉公式 |
| 07 🧭 | 平面向量 | 拖动向量端点：三角形/平行四边形法则、点积与投影 |
| 08 🎲 | 概率统计 | 高尔顿钉板、蒙提霍尔三扇门（可玩 + 千局模拟）、大数定律抛硬币 |

每个主题配 **知识点速览**（KaTeX 公式）与 **5 道即判小测**（含解析），答题进度自动保存在浏览器 `localStorage`，首页有总进度环。

## 🚀 部署到 GitHub Pages（GitHub Actions，全自动）

仓库自带工作流 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)：

- **首次部署**：仓库已有工作流，推送到 `main` 即自动部署。若仓库从未开启过 Pages，工作流会通过 `configure-pages` 的 `enablement` 自动开启（个人仓库无需手动设置）。
- **日常更新**：每次 `git push` 到 `main` 自动重新部署，也可在 Actions 页面手动触发（`workflow_dispatch`）。
- 部署完成后访问 `https://<用户名>.github.io/<仓库名>/`，例如 `https://YN1753.github.io/FunMath/`。

<details>
<summary>如果之前用过「Deploy from a branch」方式</summary>

Settings → Pages → Build and deployment → Source 改为 **GitHub Actions**，否则 `deploy-pages` 步骤会报 legacy 配置错误。
</details>

> 无需任何构建步骤：仓库里没有 package.json，全站就是 HTML/CSS/JS 静态文件；`.nojekyll` 保证资源原样发布。

## 💻 本地预览

直接双击 `index.html` 就能用；推荐起个本地服务器（公式 CDN、字体加载更顺畅）：

```bash
cd FunMath
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 📁 目录结构

```
FunMath/
├── index.html            # 首页：主题卡片 + 学习进度环
├── functions.html … probability.html   # 8 个主题页
├── .nojekyll             # 跳过 Jekyll 处理
└── assets/
    ├── css/style.css     # 全站样式（明亮清新风、响应式）
    └── js/
        ├── common.js     # 导航/页脚、KaTeX 懒加载、进度存储、测验组件、图表工具
        ├── parser.js     # 安全的数学表达式解析器（递归下降，不用 eval）
        └── *.js          # 各主题页的交互脚本
```

## 🛠️ 技术说明

- **纯原生 HTML/CSS/JS**，零构建、零框架；图形全部由 Canvas 2D 手绘（3D 为手写迷你引擎）。
- 公式渲染用 [KaTeX](https://katex.org/) CDN **懒加载**：网络不可用时优雅降级为原始文本，交互不受影响。
- 表达式输入使用自写解析器（白名单函数 + 递归下降），**不使用 eval**，无注入风险。
- 用户数据（测验进度）只存本地 `localStorage`，无任何后端与追踪。

## 📄 许可

学习用途随意取用、修改与分享。

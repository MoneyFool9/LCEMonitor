# LCEMonitor SDK 使用指南

欢迎使用 LCEMonitor SDK！本文档将引导您如何在项目中初始化并充分利用我们的监控服务。

## 1. 初始化 SDK

要开始使用，首先需要创建 `LCEMonitor` 的实例。您可以直接传入上报接口的 URL，或通过一个配置对象进行更详细的设置。

#### 基础初始化

最简单的初始化方式是直接提供上报接口的 URL。

```javascript
import LCEMonitor from '@lce-monitor/jssdk'

const monitor = new LCEMonitor('YOUR_ENDPOINT_URL')
```

#### 高级配置

为了更灵活地控制上报行为，您可以传入一个配置对象。

```javascript
import LCEMonitor from '@lce-monitor/jssdk'

const monitor = new LCEMonitor({
  endpoint: 'YOUR_ENDPOINT_URL', // 必填：上报接口地址
  batch: true, // 可选：是否开启批量上报，默认为 false
  batchSize: 20, // 可选：批量上报的事件数量阈值，默认为 10
  retryInterval: 5000 // 可选：上报失败后的重试间隔（毫秒），默认为 3000
})
```

**配置项说明:**

- **`endpoint`** (string, **必填**): 数据上报的接口地址。
- **`batch`** (boolean, 可选): 是否开启批量上报。
  - `false` (默认): 每个事件产生后会立即尝试上报。
  - `true`: 事件会先暂存到队列中，当队列数量达到 `batchSize` 或用户离开页面时再统一发送。
- **`batchSize`** (number, 可选): 批量上报的阈值，默认为 `10`。
- **`retryInterval`** (number, 可选): 上报失败后，在非页面卸载场景下的重试间隔时间（单位：毫秒），默认为 `3000`。

## 2. 自动采集功能

SDK 初始化后，将自动在后台采集以下各类核心指标和用户行为，无需额外配置。

- **页面浏览量 (PV)**: 每次页面加载或前端路由切换时，自动记录一次页面浏览。
- **独立访客 (UV)**: 在 24 小时内，为每个独立用户记录一次访问。
- **页面停留时长**: 在用户切换或关闭页面时，自动计算并上报用户在当前页面的停留时间。
- **点击事件**: 自动监听并采集带有 `data-lce-event` 属性的 HTML 元素的点击事件。
  - **使用方法**: 只需在需要追踪的元素上添加该属性。
  - **示例**: `<button data-lce-event="confirm-payment">确认支付</button>`
- **路由变化**: 自动监听单页应用（SPA）的路由变化（支持 `hash` 和 `history` 模式），并触发新的 PV 和停留时长计算。
- **页面性能**: 在页面加载完成后，自动采集 FCP, LCP, TTFB 等核心 Web 指标及各类资源加载耗时。
- **错误与异常**: 自动捕获并上报以下三类错误：
  - JavaScript 运行时错误。
  - 未被处理的 Promise Rejection。
  - 静态资源（如图片、脚本）加载失败。

## 3. 手动上报自定义事件

除了自动采集，您还可以通过调用 `track` 方法来上报任何您关心的业务事件。

#### 方法签名

```typescript
monitor.track(event: string, data?: Record<string, any>);
```

- `event` (string): 自定义事件的名称，如 `'user-login'`。
- `data` (object, 可选): 与事件相关的附加数据对象。

#### 使用示例

```javascript
// 用户登录成功后，手动上报一个登录事件
monitor.track('user-login', {
  username: 'example_user',
  loginMethod: 'password'
})

// 用户将商品加入购物车
monitor.track('add-to-cart', {
  productId: '12345',
  quantity: 1,
  price: 99.9
})
```

## 4. 自定义错误处理

SDK 内部的所有操作都经过了错误处理，以防止监控代码本身影响您的业务逻辑。默认情况下，这些内部错误会打印到控制台。如果您希望自定义处理这些异常，可以使用 `registerErrorHandler` 方法。

#### 使用示例

```javascript
monitor.registerErrorHandler((error) => {
  console.error('My custom error handler caught an error:', error)
  // myOwnErrorReporter.send(error);
})
```

---

现在，您已经掌握了 LCEMonitor SDK 的核心用法。开始在您的项目中集成并监测数据吧！

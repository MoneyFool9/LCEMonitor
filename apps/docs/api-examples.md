# 快速上手

在本节中，我们将介绍如何在你的网站上引入我们的埋点监控服务，并且正确管理和监测你的网站日志数据。

---

## 通过npm包使用sdk

请你使用`node`至少16以上的版本进行安装，使用`npm`或者`pnpm` 等包管理器进行安装（以下使用`npm`安装）。

```
npm install @lce-monitor/jssdk
```

这一指令将会安装埋点sdk到你的项目中，你可以直接通过模块引入，例如：

```
import LCEMonitor from "@lce-monitor/jssdk"

const monitor = new LCEMonitor(endpoint);
```

- LCEMonitor：该包导出一个类用于初始化网站埋点监控服务。
- endpoint：这是服务提供的相应上报地址，可注册获得。

## 通过CDN使用sdk

你可以借助 script 标签直接通过 CDN 来使用我们的埋点sdk：

```html
<script src="https://unpkg.com/@lce-monitor/jssdk@1.0.0/dist/index.js"></script>
```

直接使用cdn可以更加轻量化的使用我们的埋点实例，你只需要实例化即可

```html
<script>
  const monitor = new LCEMonitor()
</script>
```

## 下一步

通过本节后你将会知道如何使用sdk来让你的网站可以被监测，如需知道更多的API或者服务，请阅读下一节

import App from './App'
import { createSSRApp } from 'vue'

// 全局混入
const globalMixin = {
  data() {
    return {
      // 全局状态
    }
  },
  methods: {
    // 全局方法
    $formatTime(seconds) {
      if (!seconds || seconds < 0) return '00:00'
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    },
    
    $formatSize(bytes) {
      if (!bytes) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      const index = Math.floor(Math.log(bytes) / Math.log(1024))
      const size = (bytes / Math.pow(1024, index)).toFixed(2)
      return `${size} ${units[index]}`
    }
  }
}

export function createApp() {
  const app = createSSRApp(App)
  
  // 应用全局混入
  app.mixin(globalMixin)
  
  // 全局属性
  app.config.globalProperties.$appName = '鸿蒙视频播放器'
  app.config.globalProperties.$version = '1.0.0'
  
  // 全局错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('全局错误捕获:', err, info)
  }
  
  return {
    app
  }
}
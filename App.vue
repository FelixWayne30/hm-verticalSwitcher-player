<template>
  <view>
    <slot></slot>
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
    this.initApp()

    // 设置屏幕方向为竖屏（仅 APP 端生效）
    // #ifdef APP-PLUS
    if (plus && plus.screen) {
      plus.screen.lockOrientation('portrait-primary')
    }
    // #endif
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    initApp() {
      console.log('初始化应用配置')
      
      // 设置状态栏样式
      // #ifdef APP-PLUS
      if (plus && plus.navigator) {
        // 默认使用浅色状态栏
        if (plus.navigator.setStatusBarStyle) {
          plus.navigator.setStatusBarStyle('light')
        }
        // 设置状态栏背景色
        if (plus.navigator.setStatusBarBackground) {
          plus.navigator.setStatusBarBackground('#FFFFFF')
        }
      }
      // #endif
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #FFFFFF;
  height: 100%;
}
</style>
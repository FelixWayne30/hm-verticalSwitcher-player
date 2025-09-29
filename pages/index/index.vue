<template>
  <view class="index-container">
    <button @click="goFolder">管理视频</button>
  </view>
</template>

<script>
export default {
  methods: {
    goFolder() {
      uni.navigateTo({ url: '/pages/folder/folder' })
    }
  }
}
</script>

<style>
.index-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
button {
  padding: 20rpx 40rpx;
  font-size: 32rpx;
}
</style>

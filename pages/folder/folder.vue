<template>
  <view class="container">
    <!-- 操作栏 -->
    <view class="toolbar">
      <button @click="chooseVideo">从相册选择视频</button>
      <button @click="chooseFile">从文件选择视频</button>
      <button @click="loadSavedVideos">刷新列表</button>
    </view>

    <!-- 已保存的视频列表 -->
    <view v-if="videos.length > 0" class="video-list">
      <view
        v-for="(video, idx) in videos"
        :key="video.path"
        class="video-item"
        @click="playVideo(idx)"
      >
        <text class="name">🎬 {{ video.name || video.path.split('/').pop() }}</text>
        <button class="delete-btn" @click.stop="removeVideo(video.path)">删除</button>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty">暂无已保存视频</view>
  </view>
</template>

<script>
import videoManager from '@/utils/videoManager.js'

export default {
  data() {
    return {
      videos: []
    }
  },
  onShow() {
    this.loadSavedVideos()
  },
  methods: {
    chooseVideo() {
      uni.chooseVideo({
        sourceType: ['album'],
        success: (res) => this.saveToSandbox(res.tempFilePath)
      })
    },
    chooseFile() {
      uni.chooseFile({
        count: 1,
        type: 'video',
        success: (res) => {
          const file = res.tempFiles[0]
          this.saveToSandbox(file.path)
        }
      })
    },
    saveToSandbox(tempPath) {
      uni.saveFile({
        tempFilePath: tempPath,
        success: () => {
          uni.showToast({ title: '保存成功', icon: 'success' })
          this.loadSavedVideos()
        },
        fail: () => uni.showToast({ title: '保存失败', icon: 'none' })
      })
    },
    loadSavedVideos() {
      videoManager.getHarmonyVideos().then(videos => {
        this.videos = videos
      })
    },
    removeVideo(path) {
      uni.removeSavedFile({
        filePath: path,
        success: () => {
          uni.showToast({ title: '已删除', icon: 'success' })
          this.loadSavedVideos()
        }
      })
    },
    playVideo(index) {
      videoManager.setCurrentIndex(index)
      uni.navigateTo({ url: '/pages/player/player' })
    }
  }
}
</script>

<style>
.container {
  padding: 20rpx;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.video-list {
  margin-top: 20rpx;
}
.video-item {
  padding: 15rpx;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.delete-btn {
  font-size: 24rpx;
  color: red;
}
.empty {
  text-align: center;
  color: #888;
  margin-top: 40rpx;
}
</style>

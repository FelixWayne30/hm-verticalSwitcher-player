<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back-btn" @click="goBack">
        <view class="back-arrow"></view>
      </view>
      <text class="title">导入管理</text>
      <view class="placeholder"></view>
    </view>

    <!-- 列表选择器 -->
    <view class="selector-section">
      <text class="section-label">目标播放列表</text>
      <picker 
        mode="selector" 
        :range="playlistNames" 
        :value="pickerIndex" 
        @change="onPick"
        class="picker-wrapper"
      >
        <view class="picker-display">
          <text class="picker-text">{{ selectedListName || '请选择播放列表' }}</text>
          <view class="picker-arrow"></view>
        </view>
      </picker>
    </view>

    <!-- 导入按钮 -->
    <view class="import-section">
      <view class="import-btn" @click="chooseVideo">
        <view class="btn-icon">
          <view class="image-icon"></view>
        </view>
        <view class="btn-content">
          <text class="btn-title">从相册导入</text>
          <text class="btn-desc">选择手机相册中的视频文件</text>
        </view>
      </view>

      <view class="import-btn" @click="openCreateList">
        <view class="btn-icon create">
          <view class="create-icon"></view>
        </view>
        <view class="btn-content">
          <text class="btn-title">新建播放列表</text>
          <text class="btn-desc">创建一个新的视频列表</text>
        </view>
      </view>
    </view>

    <!-- 当前列表视频 -->
    <view class="video-section" v-if="selectedListId">
      <view class="section-header">
        <text class="section-title">{{ selectedListName }}</text>
        <text class="video-count">{{ videos.length }} 个视频</text>
      </view>

      <scroll-view class="video-list" scroll-y v-if="videos.length > 0">
        <view 
          v-for="(v, idx) in videos" 
          :key="v.id" 
          class="video-item"
        >
          <view class="video-info">
            <view class="video-thumb">
              <view class="thumb-play-icon"></view>
            </view>
            <view class="video-details">
              <text class="video-name">{{ v.name }}</text>
              <text class="video-meta">{{ formatSize(v.size) }}</text>
            </view>
          </view>
          <view class="video-actions">
            <view class="icon-btn play" @click="playOne(idx)">
              <view class="play-btn-icon"></view>
            </view>
            <view class="icon-btn delete" @click="removeOne(v.id)">
              <view class="delete-btn-icon"></view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-else class="empty-list">
        <view class="empty-icon">
          <view class="video-empty-icon"></view>
        </view>
        <text class="empty-text">列表为空，点击上方按钮导入视频</text>
      </view>
    </view>

    <!-- 新建列表弹窗 -->
    <view v-if="showCreate" class="modal-overlay" @click="showCreate=false">
      <view class="modal-box" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新建播放列表</text>
        </view>
        <view class="modal-body">
          <input 
            v-model="newListName" 
            class="modal-input"
            placeholder="输入列表名称" 
            :focus="showCreate"
          />
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="showCreate=false">
            <text>取消</text>
          </view>
          <view class="modal-btn confirm" @click="doCreateList">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import videoManager from '@/utils/videoManager.js'

export default {
  data() {
    return {
      playlists: [],
      pickerIndex: 0,
      selectedListId: null,
      selectedListName: '',
      videos: [],
      showCreate: false,
      newListName: '',
      statusBarHeight: 44
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 44
  },
  onShow() {
    this.loadPlaylists()
  },
  computed: {
    playlistNames() {
      return this.playlists.map(p => p.name)
    }
  },
  methods: {
    loadPlaylists() {
      this.playlists = videoManager.getPlaylists()
      if (this.playlists.length > 0) {
        if (this.pickerIndex >= this.playlists.length) this.pickerIndex = 0
        this.setSelected(this.pickerIndex)
      } else {
        this.selectedListId = null
        this.selectedListName = ''
        this.videos = []
      }
    },
    setSelected(idx) {
      const p = this.playlists[idx]
      if (p) {
        this.selectedListId = p.id
        this.selectedListName = p.name
        this.pickerIndex = idx
        this.videos = videoManager.getVideos(p.id)
      }
    },
    onPick(e) {
      const idx = e.detail.value
      this.setSelected(idx)
    },
    openCreateList() {
      this.showCreate = true
      this.newListName = ''
    },
    doCreateList() {
      const name = (this.newListName || '').trim()
      if (!name) {
        uni.showToast({ title: '请输入名称', icon: 'none' })
        return
      }
      const p = videoManager.addPlaylist(name)
      this.showCreate = false
      this.loadPlaylists()
      const idx = this.playlists.findIndex(x => x.id === p.id)
      if (idx !== -1) this.setSelected(idx)
    },
    chooseVideo() {
      if (!this.selectedListId) {
        uni.showToast({ title: '请先选择播放列表', icon: 'none' })
        return
      }
      uni.chooseVideo({
        sourceType: ['album'],
        success: (res) => this.saveAndAdd(res.tempFilePath),
        fail: (err) => console.error('chooseVideo fail', err)
      })
    },
    saveAndAdd(tempPath) {
      uni.showLoading({ title: '导入中...', mask: true })
      uni.saveFile({
        tempFilePath: tempPath,
        success: (saveRes) => {
          uni.hideLoading()
          const saved = saveRes.savedFilePath
          const obj = { name: saved.split('/').pop(), path: saved, url: saved }
          const v = videoManager.addVideoToPlaylist(this.selectedListId, obj)
          if (v) {
            uni.showToast({ title: '导入成功', icon: 'success' })
            this.videos = videoManager.getVideos(this.selectedListId)
          } else {
            uni.showToast({ title: '导入失败', icon: 'none' })
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('saveFile fail', err)
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    },
    playOne(idx) {
      videoManager.setCurrentIndex(idx)
      uni.navigateTo({ url: `/pages/tiktok/tiktokPlayer?listId=${this.selectedListId}&start=${idx}` })
    },
    removeOne(videoId) {
      uni.showModal({
        title: '删除视频',
        content: '确认从列表中移除该视频？',
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) {
            videoManager.removeVideoFromPlaylist(this.selectedListId, videoId)
            this.videos = videoManager.getVideos(this.selectedListId)
            uni.showToast({ title: '已移除', icon: 'success' })
          }
        }
      })
    },
    formatSize(bytes) {
      if (!bytes) return '未知大小'
      const units = ['B', 'KB', 'MB', 'GB']
      const index = Math.floor(Math.log(bytes) / Math.log(1024))
      const size = (bytes / Math.pow(1024, index)).toFixed(1)
      return `${size} ${units[index]}`
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FFFFFF;
}

/* 顶部导航 */
.header {
  background: #FFFFFF;
  padding: 20rpx 24rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #F2F2F7;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Back Arrow */
.back-arrow {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #007AFF;
  border-bottom: 4rpx solid #007AFF;
  transform: rotate(45deg);
  margin-left: 8rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
}

.placeholder {
  width: 64rpx;
}

/* 选择器区域 */
.selector-section {
  background: #FFFFFF;
  margin: 16rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-label {
  font-size: 24rpx;
  color: #8E8E93;
  margin-bottom: 16rpx;
  display: block;
}

.picker-wrapper {
  width: 100%;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #F2F2F7;
  border-radius: 16rpx;
  transition: background 0.2s;
}

.picker-display:active {
  background: #E5E5EA;
}

.picker-text {
  font-size: 28rpx;
  color: #000000;
  font-weight: 500;
}

/* Picker Arrow */
.picker-arrow {
  width: 16rpx;
  height: 16rpx;
  border-right: 3rpx solid #C7C7CC;
  border-bottom: 3rpx solid #C7C7CC;
  transform: rotate(-45deg);
  margin-bottom: 4rpx;
}

/* 导入按钮组 */
.import-section {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.import-btn {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.import-btn:active {
  transform: scale(0.98);
  background: #F9F9F9;
}

.btn-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.create {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* Image Icon */
.image-icon {
  width: 40rpx;
  height: 36rpx;
  border: 4rpx solid #FFFFFF;
  border-radius: 6rpx;
  position: relative;
}

.image-icon::before {
  content: '';
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: #FFFFFF;
  border-radius: 50%;
  top: 2rpx;
  left: 2rpx;
}

.image-icon::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 14rpx solid transparent;
  border-right: 14rpx solid transparent;
  border-bottom: 12rpx solid #FFFFFF;
  bottom: -2rpx;
  left: 50%;
  transform: translateX(-50%);
}

/* Create Icon */
.create-icon {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}

.create-icon::before,
.create-icon::after {
  content: '';
  position: absolute;
  background: #FFFFFF;
  border-radius: 2rpx;
}

.create-icon::before {
  left: 50%;
  top: 0;
  width: 4rpx;
  height: 32rpx;
  transform: translateX(-50%);
}

.create-icon::after {
  top: 50%;
  left: 0;
  width: 32rpx;
  height: 4rpx;
  transform: translateY(-50%);
}

.btn-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.btn-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
}

.btn-desc {
  font-size: 22rpx;
  color: #8E8E93;
}

/* 视频列表区域 */
.video-section {
  margin: 16rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #F2F2F7;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
}

.video-count {
  font-size: 24rpx;
  color: #8E8E93;
}

.video-list {
  max-height: 800rpx;
}

.video-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #F2F2F7;
  transition: background 0.2s;
}

.video-item:last-child {
  border-bottom: none;
}

.video-item:active {
  background: #F9F9F9;
}

.video-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-right: 16rpx;
}

.video-thumb {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Thumb Play Icon */
.thumb-play-icon {
  width: 0;
  height: 0;
  border-left: 20rpx solid #FFFFFF;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  margin-left: 4rpx;
}

.video-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  overflow: hidden;
}

.video-name {
  font-size: 26rpx;
  color: #000000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  font-size: 22rpx;
  color: #8E8E93;
}

.video-actions {
  display: flex;
  gap: 8rpx;
}

.icon-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn.play {
  background: #F2F2F7;
}

.icon-btn.play:active {
  background: #E5E5EA;
  transform: scale(0.9);
}

.icon-btn.delete {
  background: #F2F2F7;
}

.icon-btn.delete:active {
  background: rgba(255, 59, 48, 0.1);
  transform: scale(0.9);
}

/* Play Button Icon */
.play-btn-icon {
  width: 0;
  height: 0;
  border-left: 16rpx solid #007AFF;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  margin-left: 4rpx;
}

/* Delete Button Icon */
.delete-btn-icon {
  width: 24rpx;
  height: 4rpx;
  background: #FF3B30;
  border-radius: 2rpx;
}

/* 空列表 */
.empty-list {
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-icon {
  width: 100rpx;
  height: 100rpx;
  background: #F2F2F7;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Video Empty Icon */
.video-empty-icon {
  width: 50rpx;
  height: 36rpx;
  border: 4rpx solid #8E8E93;
  border-radius: 6rpx;
  position: relative;
}

.video-empty-icon::before {
  content: '';
  width: 0;
  height: 0;
  border-left: 16rpx solid #8E8E93;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-40%, -50%);
}

.empty-text {
  font-size: 24rpx;
  color: #8E8E93;
  text-align: center;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  overflow: hidden;
}

.modal-header {
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #F2F2F7;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  text-align: center;
}

.modal-body {
  padding: 24rpx 32rpx;
}

.modal-input {
  width: 100%;
  height: 88rpx;
  background: #F2F2F7;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #000000;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #F2F2F7;
}

.modal-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  transition: background 0.2s;
}

.modal-btn:active {
  background: #F2F2F7;
}

.modal-btn.cancel {
  color: #8E8E93;
  border-right: 1rpx solid #F2F2F7;
}

.modal-btn.confirm {
  color: #007AFF;
  font-weight: 600;
}
</style>
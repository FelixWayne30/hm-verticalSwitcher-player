<template>
  <view class="container">
    <!-- 顶部导航栏 - 适配状态栏 -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="app-title">我的视频</text>
      <view class="nav-actions">
        <view class="icon-btn" @click="goFolder">
          <view class="plus-icon"></view>
        </view>
      </view>
    </view>

    <!-- 视频列表 -->
    <scroll-view class="content" scroll-y>
      <view class="playlists-container">
        <!-- 播放列表卡片 -->
        <view 
          v-for="pl in playlists" 
          :key="pl.id" 
          class="playlist-card"
          @click="enterList(pl.id)"
          @longpress="showActions(pl)"
        >
          <view class="card-inner">
            <text class="playlist-name">{{ pl.name }}</text>
            <text class="video-count">{{ pl.videos.length }} 个视频</text>
          </view>
        </view>

        <!-- 新建列表卡片 -->
        <view class="playlist-card add-card" @click="onCreate">
          <view class="add-inner">
            <view class="add-icon-wrapper">
              <view class="add-icon"></view>
            </view>
            <text class="add-text">新建列表</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="playlists.length === 0" class="empty-state">
        <view class="empty-icon-wrapper">
          <view class="folder-icon"></view>
        </view>
        <text class="empty-title">还没有播放列表</text>
        <text class="empty-desc">点击右上角按钮开始导入视频</text>
      </view>
    </scroll-view>

    <!-- 操作菜单弹窗 -->
    <view v-if="showActionMenu" class="action-menu-overlay" @click="closeActionMenu">
      <view class="action-menu" @click.stop>
        <view class="menu-header">
          <text class="menu-title">{{ selectedPlaylist?.name }}</text>
        </view>
        <view class="menu-item" @click="renameList">
          <text class="menu-item-text">重命名</text>
        </view>
        <view class="menu-item delete" @click="removeList">
          <text class="menu-item-text">删除</text>
        </view>
        <view class="menu-item cancel" @click="closeActionMenu">
          <text class="menu-item-text">取消</text>
        </view>
      </view>
    </view>

    <!-- 创建/重命名弹窗 -->
    <view v-if="showInput" class="modal-overlay" @click="cancelInput">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ inputLabel }}</text>
        </view>
        <view class="modal-body">
          <input 
            v-model="inputValue" 
            class="modal-input"
            placeholder="输入列表名称" 
            :focus="showInput"
          />
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="cancelInput">
            <text>取消</text>
          </view>
          <view class="modal-btn confirm" @click="confirmInput">
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
      showInput: false,
      inputValue: '',
      inputLabel: '新建列表',
      editingId: null,
      statusBarHeight: 44,
      showActionMenu: false,
      selectedPlaylist: null
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 44
  },
  onShow() {
    this.load()
  },
  methods: {
    load() {
      this.playlists = videoManager.getPlaylists()
    },
    onCreate() {
      this.inputLabel = '新建列表'
      this.inputValue = ''
      this.editingId = null
      this.showInput = true
    },
    enterList(listId) {
      uni.navigateTo({ url: `/pages/tiktok/tiktokPlayer?listId=${listId}` })
    },
    showActions(playlist) {
      this.selectedPlaylist = playlist
      this.showActionMenu = true
    },
    closeActionMenu() {
      this.showActionMenu = false
      this.selectedPlaylist = null
    },
    renameList() {
      if (!this.selectedPlaylist) return
      this.inputLabel = '重命名列表'
      this.inputValue = this.selectedPlaylist.name
      this.editingId = this.selectedPlaylist.id
      this.showActionMenu = false
      this.showInput = true
    },
    removeList() {
      if (!this.selectedPlaylist) return
      const listId = this.selectedPlaylist.id
      this.showActionMenu = false
      
      uni.showModal({
        title: '删除列表',
        content: '确认删除这个播放列表吗？',
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) {
            videoManager.removePlaylist(listId)
            this.load()
            uni.showToast({ 
              title: '已删除', 
              icon: 'success',
              duration: 1500
            })
          }
        }
      })
    },
    cancelInput() {
      this.showInput = false
      this.inputValue = ''
      this.editingId = null
    },
    confirmInput() {
      const name = (this.inputValue || '').trim()
      if (!name) {
        uni.showToast({ title: '请输入名称', icon: 'none' })
        return
      }
      if (this.editingId) {
        videoManager.renamePlaylist(this.editingId, name)
      } else {
        videoManager.addPlaylist(name)
      }
      this.showInput = false
      this.load()
    },
    goFolder() {
      uni.navigateTo({ url: '/pages/folder/folder' })
    }
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  min-height: 100vh;
  background: #F5F5F7;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.navbar {
  padding: 20rpx 32rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  border-bottom: 1rpx solid #E5E5EA;
}

.app-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #000000;
  letter-spacing: -0.5rpx;
}

.nav-actions {
  display: flex;
  gap: 16rpx;
}

.icon-btn {
  width: 64rpx;
  height: 64rpx;
  background: #007AFF;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:active {
  transform: scale(0.92);
  background: #0051D5;
}

/* Plus Icon */
.plus-icon {
  width: 28rpx;
  height: 28rpx;
  position: relative;
}

.plus-icon::before,
.plus-icon::after {
  content: '';
  position: absolute;
  background: #FFFFFF;
  border-radius: 2rpx;
}

.plus-icon::before {
  left: 50%;
  top: 0;
  width: 4rpx;
  height: 28rpx;
  transform: translateX(-50%);
}

.plus-icon::after {
  top: 50%;
  left: 0;
  width: 28rpx;
  height: 4rpx;
  transform: translateY(-50%);
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 24rpx 32rpx;
  width: 100%;
  box-sizing: border-box;
}

.playlists-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  box-sizing: border-box;
}

/* 播放列表卡片 */
.playlist-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.playlist-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-inner {
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.playlist-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  line-height: 1.3;
}

.video-count {
  font-size: 24rpx;
  color: #8E8E93;
}

/* 新建卡片 */
.add-card {
  background: #F2F2F7;
  border: 3rpx dashed #C7C7CC;
  box-shadow: none;
}

.add-inner {
  padding: 40rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.add-icon-wrapper {
  width: 60rpx;
  height: 60rpx;
  background: #FFFFFF;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-icon {
  width: 28rpx;
  height: 28rpx;
  position: relative;
}

.add-icon::before,
.add-icon::after {
  content: '';
  position: absolute;
  background: #8E8E93;
  border-radius: 2rpx;
}

.add-icon::before {
  left: 50%;
  top: 0;
  width: 4rpx;
  height: 28rpx;
  transform: translateX(-50%);
}

.add-icon::after {
  top: 50%;
  left: 0;
  width: 28rpx;
  height: 4rpx;
  transform: translateY(-50%);
}

.add-text {
  font-size: 28rpx;
  color: #8E8E93;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: #F2F2F7;
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

/* Folder Icon */
.folder-icon {
  width: 60rpx;
  height: 48rpx;
  background: #8E8E93;
  border-radius: 4rpx;
  position: relative;
}

.folder-icon::before {
  content: '';
  position: absolute;
  width: 24rpx;
  height: 8rpx;
  background: #8E8E93;
  border-radius: 4rpx 4rpx 0 0;
  left: 4rpx;
  top: -6rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #8E8E93;
  text-align: center;
}

/* 操作菜单 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20rpx);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.action-menu {
  width: 100%;
  background: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.menu-header {
  padding: 32rpx;
  border-bottom: 1rpx solid #F2F2F7;
}

.menu-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  text-align: center;
  display: block;
}

.menu-item {
  padding: 32rpx;
  border-bottom: 1rpx solid #F2F2F7;
  transition: background 0.2s;
}

.menu-item:active {
  background: #F2F2F7;
}

.menu-item.cancel {
  border-bottom: none;
  margin-top: 16rpx;
}

.menu-item.delete .menu-item-text {
  color: #FF3B30;
}

.menu-item.cancel .menu-item-text {
  color: #8E8E93;
}

.menu-item-text {
  font-size: 30rpx;
  color: #000000;
  text-align: center;
  display: block;
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

.modal-content {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #F2F2F7;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
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
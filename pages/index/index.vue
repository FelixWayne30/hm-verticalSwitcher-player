<template>
  <view class="page">
    <view class="header">
      <text class="title">播放列表</text>
      <button class="btn" @click="onCreate">新建列表</button>
      <button class="btn" @click="goFolder">导入管理</button>
    </view>

    <view class="lists">
      <view v-for="pl in playlists" :key="pl.id" class="list-card" @click="enterList(pl.id)">
        <text class="list-name">{{ pl.name }}</text>
        <text class="count">{{ pl.videos.length }} 个</text>
        <view class="list-actions">
          <button @click.stop="renameList(pl.id)">重命名</button>
          <button @click.stop="removeList(pl.id)">删除</button>
        </view>
      </view>
    </view>

    <view v-if="playlists.length === 0" class="empty">还没有播放列表，点击“新建列表”开始</view>

    <!-- 创建/重命名对话 -->
    <view v-if="showInput" class="modal">
      <view class="modal-content">
        <text>{{ inputLabel }}</text>
        <input v-model="inputValue" placeholder="输入列表名称" />
        <view class="modal-actions">
          <button @click="confirmInput">确定</button>
          <button @click="cancelInput">取消</button>
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
      editingId: null
    }
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
    renameList(listId) {
      const p = this.playlists.find(x => x.id === listId)
      if (!p) return
      this.inputLabel = '重命名列表'
      this.inputValue = p.name
      this.editingId = listId
      this.showInput = true
    },
    removeList(listId) {
      uni.showModal({
        title: '删除列表',
        content: '仅会删除列表（不删除沙箱视频文件），确认删除？',
        success: (res) => {
          if (res.confirm) {
            videoManager.removePlaylist(listId)
            this.load()
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

<style>
.page { padding: 24rpx; }
.header { display:flex; gap:12rpx; align-items:center; margin-bottom:18rpx; }
.title { font-size:34rpx; font-weight:bold; flex:1; }
.btn { padding:8rpx 12rpx; }
.lists { display:flex; flex-direction:column; gap:12rpx; }
.list-card { padding:16rpx; background:#fff; border-radius:8rpx; box-shadow:0 1rpx 4rpx rgba(0,0,0,0.06); }
.list-name { font-size:28rpx; }
.count { color:#888; margin-left:8rpx; }
.list-actions { margin-top:8rpx; display:flex; gap:8rpx; }
.empty { color:#888; text-align:center; margin-top:40rpx; }

/* modal */
.modal { position:fixed; left:0; right:0; top:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
.modal-content { background:#fff; padding:24rpx; width:86%; border-radius:8rpx; }
.modal-actions { display:flex; justify-content:space-between; margin-top:12rpx; }
</style>

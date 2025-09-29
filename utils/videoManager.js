/**
 * 视频文件管理工具 (沙箱模式)
 * 统一使用 path 字段
 */

class VideoManager {
  constructor() {
    this.videoList = []
    this.currentIndex = 0
  }

  /**
   * 获取沙箱内的视频文件
   */
  async getHarmonyVideos() {
    return new Promise((resolve) => {
      uni.getSavedFileList({
        success: (res) => {
          this.videoList = res.fileList.map(item => ({
            id: this.generateId(),
            name: item.filePath.split('/').pop(),
            path: item.filePath, // 统一字段
            url: item.filePath,
            size: item.size,
            modificationTime: item.createTime
          }))
          resolve(this.videoList)
        },
        fail: () => resolve([])
      })
    })
  }

  /** 生成唯一ID */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /** 获取下一个视频 */
  getNextVideo() {
    if (this.videoList.length === 0) return null
    this.currentIndex = (this.currentIndex + 1) % this.videoList.length
    return this.videoList[this.currentIndex]
  }

  /** 获取上一个视频 */
  getPreviousVideo() {
    if (this.videoList.length === 0) return null
    this.currentIndex = (this.currentIndex - 1 + this.videoList.length) % this.videoList.length
    return this.videoList[this.currentIndex]
  }

  /** 获取当前视频 */
  getCurrentVideo() {
    if (this.videoList.length === 0) return null
    return this.videoList[this.currentIndex]
  }

  /** 设置当前索引 */
  setCurrentIndex(index) {
    if (index >= 0 && index < this.videoList.length) {
      this.currentIndex = index
      return true
    }
    return false
  }
}

export default new VideoManager()

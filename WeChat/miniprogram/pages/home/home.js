//home.js
const app = getApp();
Page({
  data: {
    openid: '',
  },
  onLoad: function () {
   this.getOpenid();
  },
 // 获取用户openid
 getOpenid() {
  wx.cloud.callFunction({
   name: 'getOpenid'
  })
  .then(res => {
    this.setData({
      OPENID: res.result.openid,
    })
    console.log(res.result.openid)
  })
}
})
//app.js
App({
  onLaunch: function() {
   //云开发初始化
   wx.cloud.init({
    env: 'cloud1-0gn2vs7pbc04f5b4',
    traceUser: true
   })
  }
 })
// miniprogram/pages/drawing/drawing.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    patterns: [],
    paintMode: "select",
    boardScale: 1,
    boardX: 0,
    boardY: 0,
    selected: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  
  createPattern: function(ctx, x, y, type) {
    this.patterns.push({
      x: x,
      y: y,
      height: 100,
      width: 150,
      type: type,
    })
  },

  createText: function(ctx, x, y, text) {
    this.patterns.push({
      x: x,
      y: y,
      size: 14,
      type: "text",
    })
  },

  selectObject: function(x, y){
    var selectedIndex = this.patterns.findIndex((value, index, array)=>{
      return x > value.x 
        && x < value.x + value.width
        && y > value.y
        && y < value.y + value.height
    })
    if (selectedIndex==-1){
      this.selected = null
    }
    else{
      this.patterns.push(this.patterns.splice(selectedIndex, 1)[0])
      this.selected = this.patterns[this.patterns.length - 1]
    }
  },

  onTouchCanvas: function(){

  }
})
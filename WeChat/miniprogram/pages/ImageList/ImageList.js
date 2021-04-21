// miniprogram/pages/ImageList.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    navbarHeight: 0,
    headerHeight: 0,
    scrollViewHeight: 0,
    number: 1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
        wx.getSystemInfo({
          success: function(res) {
              that.setData({
                  windowHeight: res.windowHeight
              });
          }
      });

      let query = wx.createSelectorQuery().in(this);
      query.select('#navbar').boundingClientRect();
      query.select('#header').boundingClientRect();

      query.exec((res) => {
          let navbarHeight = res[0].height;
          let headerHeight = res[1].height;

          let scrollViewHeight = this.data.windowHeight - navbarHeight - headerHeight;

          this.setData({
              scrollViewHeight: scrollViewHeight
          });
      });
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

  }
})
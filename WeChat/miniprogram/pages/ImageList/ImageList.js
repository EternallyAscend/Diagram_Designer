// miniprogram/pages/ImageList.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    create: false,
    uuid: null,
    number: -1,
    figureList: null,
    name: "",
    desc: "",
    titlesHeight: 40,
    windowHeight: 0,
    navbarHeight: 0,
    headerHeight: 0,
    scrollViewHeight: 0,
  },

  onGetOpenid: function() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.setData({
          uuid: res.result.openid,
        });
      },
      fail: err => {
        console.error(err);
        this.onGetOpenid();
      }
    })
  },

  setName: function(e) {
    this.setData({
      name: e.detail.value,
    });
  },

  setDescription: function(e) {
    this.setData({
      desc: e.detail.value,
    });
  },

  setNameDescrption: function() {
    this.setData({
      create: true,
    })
    this.onLoad();
  },

  cancelCreateFigure: function() {
    this.setData({
      create: false,
      name: "",
      desc: "",
    })
    this.onLoad();
  },

  createFigure: function() {
    if (this.data.name.length == 0) {
      wx.showToast({
        icon: 'none',
        title: 'Please input title.',
      });
      return;
    }
    if (this.data.desc.length == 0) {
      wx.showToast({
        icon: 'none',
        title: 'No Description.',
      });
      return;
    }
    let time = new Date().toLocaleString(); //.split('/').join('-');
    // console.log(new Date().toLocaleDateString());
    let grap = null;
    let database = wx.cloud.database();
    database.collection('Graph').add({
      data: {
        name: this.data.name,
        desc: this.data.desc,
        time: time,
        grap: grap,
      },
      success: res => {
        let id = res._id;
        wx.showToast({
          title: 'Create OK.',
        });
        this.setData({
          create: false,
          name: "",
          desc: "",
        });
        this.onLoad();
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Create Failed.',
        });
        console.error(err);
        this.setData({
          create: false,
          name: "",
          desc: "",
        });
        this.onLoad();
      }
    });
  },

  openFigure: function(arg) {
    console.log(arg.currentTarget.dataset.index);
    wx.navigateTo({
      url: 'pages/Drawing/Drawing?Image=' + arg.currentTarget.dataset.index,
      events: events,
      success: (result) => {},
      fail: (res) => {},
      complete: (res) => {},
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // Fetch User Information.
    this.onGetOpenid();

    let database = wx.cloud.database();
    database.collection('Graph').where({
      _openid: this.data.uuid,
    }).get({
      success: res => {
        this.setData({
          figureList: res.data,
          number: res.data.length,
        });
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Loading Failed.'
        })
        console.error(err)
      }
    });
    

    // Fetch System Information.
    let that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowHeight: res.windowHeight,
          navbarHeight: res.navbarHeight,
          headerHeight: res.navbarHeight
        });
      }
    });

    let scrollHeight = this.data.windowHeight - this.data.titlesHeight;

    this.setData({
        scrollViewHeight: scrollHeight
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
    this.onLoad();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    wx.showToast({
      icon: 'none',
      title: 'Reach Bottom.',
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    wx.showShareMenu({
      withShareTicket: true,
    })
  }
})
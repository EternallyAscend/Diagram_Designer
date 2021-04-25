// miniprogram/pages/drawing/drawing.js
const app = getApp();

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
    canvas: null,
    graphId: null,
    editable: true,
  },

  readImage: function(id) {
    console.log(id);
    const db = wx.cloud.database()
    db.collection('Graph').doc(id).get({
      success: res => {
        if (res._id != app.globalData.openid) {
          db.collection("SharingMap").where({
            graph_id: id,
            user_id: app.globalData.openid,
          }).get({
            success: res => {
              this.setData({
                editable: res.data.editable,
              });
            },
            fail: err => {
              wx.showToast({
                icon: 'none',
                title: 'No Auth.',
              });
              return;
            },
          })
        }
        this.setData({
          patterns: res.data,
          // queryResult: JSON.stringify(res.data, null, 2)
        });
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Open Failed.',
        });
        wx.navigateBack();
      }
    });
  },

  onGetOpenid: function() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid;
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  saveFigure: function() {
    const db = wx.cloud.database();
    db.collection('Graph').doc(this.data.graphId).update({
      data: {
        grap: this.data.patterns,
        latest: new Date().toLocaleString(),
      },
      success: res => {
        console.log(res);
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'title',
        })
      }
    })
  },

  deleteFigure: function() {
    if (this.data.graphId && this.data.editable) {
      const db = wx.cloud.database()
      db.collection('Graph').doc(this.data.graphId).remove({
        success: res => {
          wx.showToast({
            title: 'Delete OK',
          });
          this.setData({
            graphId: null,
          });
          wx.navigateBack({
            delta: 1,
          });
          var pages = getCurrentPages();
          var beforePage = pages[pages.length - 2];
          beforePage.onLoad();
        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: 'Delete Failed.',
          });
        }
      })
    } else {
      wx.showToast({
        title: 'Not a Record.',
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const query = wx.createSelectorQuery();
    query.select("#canvas")
      .fields({node: true, size: true})
      .exec((res)=>{
        this.canvas = res[0].node
      })

    if (null == app.globalData.openid) {
      this.onGetOpenid();
    }

    // if (null == app.globalData.openid) {
    //   wx.cloud.callFunction({
    //     name: 'login',
    //     data: {},
    //     success: res => {
    //       app.globalData.openid = res.result.openid;
    //     },
    //     fail: err => {
    //       wx.showToast({
    //         title: 'No Auth!',
    //         icon: 'none',
    //         image: '',
    //         duration: 1500,
    //         mask: false,
    //         success: (result)=>{
              
    //         },
    //         fail: ()=>{},
    //         complete: ()=>{},
    //       });
    //     },
    //   });
    // }
    var that = this;
    this.setData({
      graphId: options.Image,
    });
    this.readImage(this.data.graphId);
    wx.showToast({
      title: this.data.patterns,
    });
    wx.showToast({
      title: this.data.graphId,
    })

    
    this.saveFigure();
    // this.deleteFigure();
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
  
  createPattern: function(x, y, type) {
    this.patterns.push({
      realX: x,
      realY: y,
      height: 100,
      width: 150,
      type: type,
    })
  },

  createText: function(x, y, text) {
    this.patterns.push({
      realX: x,
      realY: y,
      size: 14,
      type: "text",
      content: text,
    })
  },

  selectObject: function(x, y){
    var selectedIndex = this.patterns.findIndex((value, index, array)=>{
      return x > value.realX 
        && x < value.realX + value.width
        && y > value.realY
        && y < value.realY + value.height
    })
    if (selectedIndex==-1){
      this.selected = null
    }
    else{
      this.patterns.push(this.patterns.splice(selectedIndex, 1)[0])
      this.selected = this.patterns[this.patterns.length - 1]
    }
  },

  drawAllObjects: function(){
    const ctx = this.canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for(var i = 0; i < this.patterns.length; i++){
      drawObject(this.patterns[i], ctx)
    }
  },

  drawObject: function(obj, ctx){
    var objX = this.boardX + (obj.realX - this.boardX)*this.boardScale
    var objY = this.boardY + (obj.realY - this.boardY)*this.boardScale
    if(obj.type == "rect") {
      ctx.strokeRect(objX, objY, obj.height*this.boardScale, obj.width*this.boardScale)
    }
    else if(obj.type == "text") {
      ctx.font = obj.size + "px SimHei"
      ctx.fillText(obj.content, objX, objY)
    }
  },

  onTouchCanvas: function(event){
    switch(this.paintMode){
      case "select":
        this.selectObject(event.touches[0].pageX - this.canvas.left, event.touches[0].pageY - canvas.top)
        break
      case "rect":
        this.createPattern(event.touches[0].pageX - this.canvas.left, event.touches[0].pageY - canvas.top, this.paintMode)
        break
      
    }
    drawAllObjects()
  }
})
// miniprogram/pages/ImageList.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    SHAPE: {
      SELECT: 0,
      SQUARE: 1,
      PARALLELOGRAM: 2,
      DIAMOND: 3,
      ELLIPSE: 4,
      ARROW: 5,
      TEXT: 6,
    },
    DIRECTION: {
      RIGHT: 1,
      UP: 2,
      LEFT: 3,
      DOWN: 4,
    },
    create: false,
    // uuid: null,
    number: -1,
    figureList: null,
    name: "",
    desc: "",
    titlesHeight: 40,
    windowHeight: 0,
    windowWidth: 0,
    scrollViewHeight: 0,
    openid: null,
  },

  onGetOpenid: function() {
    wx.cloud.callFunction({
      name: 'getOpenid',
      data: {},
      success: res => {
        this.setData({
          openid: res.result.openid,
        })
        this.onLoad()
      },
      fail: err => {
        console.error(err);
      }
    });
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
    let time = new Date().toLocaleString().substr(0, 10);
    let grap = [];
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
    wx.navigateTo({
      url: '/pages/drawing/drawing?Image=' + arg.currentTarget.dataset.index,
      success: (result) => {
      },
      fail: (res) => {
        wx.showToast({
          title: 'failed' + res,
        });
      },
      complete: (res) => {},
    });
  },

  readDB: async function (){
    let database = wx.cloud.database();
    try {
      const res = await (database.collection('Graph').where({
        _openid: this.data.openid,
      }).get())
      this.setData({
        figureList: res.data,
        number: res.data.length,
      })
    } catch (err) {
      wx.showToast({
        icon: 'none',
        title: 'Loading Failed.'
      })
      console.error(err)
    }
  },

  initPreview: function(){
    for (var item in this.data.figureList){
      this.drawPreview(item)
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // Fetch User Information.
    if (null == this.data.openid) {
      this.onGetOpenid();
    }
    
    // Fetch System Information.
    let that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth,
        });
      }
    });

    let scrollHeight = this.data.windowHeight - this.data.titlesHeight;

    this.setData({
        scrollViewHeight: scrollHeight
    });

    this.readDB().then(this.initPreview)
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
  },

  drawPreview: function(index){
    const query = wx.createSelectorQuery();
    query.select("#canvas" + index)
        .fields({node: true, size: true})
        .exec((res)=>{
          var patterns = this.data.figureList[index]['grap']
          if (!patterns) return
          var canvas = res[0].node
          canvas.width = 0.44 * this.data.windowWidth
          canvas.height = 200
          this.drawAllObjects(res[0].node, patterns)
        })
  },
  
  getImageRange: function(patterns, ctx){
    var left, right, bottom, top
    for (var index in patterns){
      var pattern = patterns[index]
      if(!pattern) continue
      if(pattern.type == this.data.SHAPE.ARROW){
        for (var point in pattern.path){
          var p = pattern.path[point]
          left = left <= p.x ? left : p.x
          right = right >= p.x ? right : p.x
          top = top <= p.y ? top : p.y
          bottom = bottom >= p.y ? bottom : p.y
        }
      }
      else {
        var patternLeft
        var patternRight
        var patternTop
        var patternBottom

        if (pattern.type == this.data.SHAPE.TEXT) {
          var width = ctx.measureText(pattern.text).width / 2
          patternLeft = pattern.realX - width / 2
          patternRight = pattern.realX + width / 2
          patternTop = pattern.realY - pattern.size / 2
          patternBottom = pattern.realY + pattern.size / 2
        } else {
          patternLeft = pattern.realX - pattern.width / 2
          patternRight = pattern.realX + pattern.width / 2
          patternTop = pattern.realY - pattern.height / 2
          patternBottom = pattern.realY + pattern.height / 2
        }
        left = left <= patternLeft ? left : patternLeft
        right = right >= patternRight ? right : patternRight
        top = top <= patternTop ? top : patternTop
        bottom = bottom >= patternBottom ? bottom : patternBottom
      }
    }
    return {
      left: left,
      right: right,
      top: top,
      bottom: bottom,
    }
  },

  drawAllObjects: function(canvas, patterns){
    const ctx = canvas.getContext("2d")
    ctx.save()
    var range = this.getImageRange(patterns, ctx)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.translate(-range.left, -range.top)
    var scaleX = this.data.windowWidth * 0.44 / (range.right - range.left)
    var scaleY = canvas.height / (range.bottom - range.top)
    var scale
    if (scaleX < scaleY){
      ctx.translate(0, (canvas.height - scaleX * (range.bottom - range.top)) / 2)
      scale = scaleX
    }
    else {
      ctx.translate((this.data.windowWidth * 0.44 - scaleY * (range.right - range.left)) / 2, 0)
      scale = scaleY
    }
    ctx.scale(scale, scale)
    patterns.forEach((value) => {
      if(value) this.drawObject(value, ctx)
    })
  },

  drawObject: function(obj, ctx){
    //const AXE = {X: true, Y: false}
    if (obj.type == this.data.SHAPE.ARROW){
      var startX, startY, endX, endY
      switch(obj.startDirection){
        case this.data.DIRECTION.UP:
          startX = obj.start.realX
          startY = obj.start.realY - obj.start.height / 2
          break
        case this.data.DIRECTION.DOWN:
          startX = obj.start.realX
          startY = obj.start.realY + obj.start.height / 2
          break
        case this.data.DIRECTION.LEFT:
          startX = obj.start.type == this.data.SHAPE.PARALLELOGRAM ? obj.start.realX - obj.start.width * 3 / 8 : obj.start.realX - obj.start.width / 2
          startY = obj.start.realY
          break
        case this.data.DIRECTION.RIGHT:
          startX = obj.start.type == this.data.SHAPE.PARALLELOGRAM ? obj.start.realX + obj.start.width * 3 / 8 : obj.start.realX + obj.start.width / 2
          startY = obj.start.realY
          break
      }
      switch(obj.endDirection){
        case this.data.DIRECTION.UP:
          endX = obj.end.realX
          endY = obj.end.realY - obj.end.height / 2
          break
        case this.data.DIRECTION.DOWN:
          endX = obj.end.realX
          endY = obj.end.realY + obj.end.height / 2
          break
        case this.data.DIRECTION.LEFT:
          endX = obj.end.type == this.data.SHAPE.PARALLELOGRAM ? obj.end.realX - obj.end.width * 3 / 8 : obj.end.realX - obj.end.width / 2
          endY = obj.end.realY
          break
        case this.data.DIRECTION.RIGHT:
          endX = obj.end.type == this.data.SHAPE.PARALLELOGRAM ? obj.end.realX + obj.end.width * 3 / 8 : obj.end.realX + obj.end.width / 2
          endY = obj.end.realY
          break
      }
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      for(var point = 0; point < obj.path.length; point++){
        ctx.lineTo(obj.path[point].x, obj.path[point].y)
      }
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      switch(obj.endDirection){
        case this.data.DIRECTION.UP:
          ctx.lineTo(endX - 2, endY - 3)
          ctx.lineTo(endX + 2, endY - 3)
          break
        case this.data.DIRECTION.DOWN:
          ctx.lineTo(endX - 2, endY + 3)
          ctx.lineTo(endX + 2, endY + 3)
          break
        case this.data.DIRECTION.RIGHT:
          ctx.lineTo(endX + 3, endY - 2)
          ctx.lineTo(endX + 3, endY + 2)
          break
        case this.data.DIRECTION.LEFT:  
          ctx.lineTo(endX - 3, endY + 2)
          ctx.lineTo(endX - 3, endY - 2)
          break
      }
      ctx.closePath()
      ctx.fill()
    }
    else {
      if (obj.type == this.data.SHAPE.TEXT) {
        ctx.font = obj.size + "pt Calibri"
        var objX = obj.realX - ctx.measureText(obj.text).width / 2
        var objY = obj.realY + obj.size / 2
        //ctx.font = obj.size + "px SimHei"
        ctx.fillText(obj.text, objX, objY)
        //ctx.draw()
      }
      else {
        if (obj.text != ""){
          ctx.font = "14pt Calibri"
          var objX = obj.realX - ctx.measureText(obj.text).width / 2
          var objY = obj.realY + 7
          ctx.fillText(obj.text, objX, objY)
        }
        if (obj.type == this.data.SHAPE.SQUARE) {
          var objX = obj.realX - obj.width / 2
          var objY = obj.realY - obj.height / 2
          ctx.strokeRect(objX, objY, obj.width, obj.height)
        }
        else if (obj.type == this.data.SHAPE.DIAMOND) {
          ctx.beginPath()
          ctx.moveTo(obj.realX - obj.width / 2, obj.realY)
          ctx.lineTo(obj.realX , obj.realY - obj.height / 2)
          ctx.lineTo(obj.realX + obj.width / 2, obj.realY)
          ctx.lineTo(obj.realX , obj.realY + obj.height / 2)
          ctx.closePath()
          ctx.stroke()
        }
        else if (obj.type == this.data.SHAPE.PARALLELOGRAM) {
          ctx.beginPath()
          ctx.moveTo(obj.realX + obj.width / 2, obj.realY - obj.height / 2)
          ctx.lineTo(obj.realX - obj.width / 4, obj.realY - obj.height / 2)
          ctx.lineTo(obj.realX - obj.width / 2, obj.realY + obj.height / 2)
          ctx.lineTo(obj.realX + obj.width / 4, obj.realY + obj.height / 2)
          ctx.closePath()
          ctx.stroke()
        }
        else if (obj.type == this.data.SHAPE.ELLIPSE) {
          ctx.beginPath()
          const r = obj.width * 0.2
          ctx.arc(obj.realX + obj.width / 2 - r, obj.realY - obj.height / 2 + r, r, Math.PI * 1.5, 0)
          ctx.arc(obj.realX + obj.width / 2 - r, obj.realY + obj.height / 2 - r, r, 0, Math.PI * 0.5)
          ctx.arc(obj.realX - obj.width / 2 + r, obj.realY + obj.height / 2 - r, r, Math.PI * 0.5, Math.PI)
          ctx.arc(obj.realX - obj.width / 2 + r, obj.realY - obj.height / 2 + r, r, Math.PI, Math.PI * 1.5)
          ctx.closePath()
          ctx.stroke()
        }
      }
    }
  },

})
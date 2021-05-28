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
    navbarHeight: 0,
    headerHeight: 0,
    scrollViewHeight: 0,
  },

  onGetOpenid: function() {
    wx.cloud.callFunction({
      name: 'getOpenid',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid;
        // this.setData({
        //   uuid: res.result.openid,
        // });
      },
      fail: err => {
        console.error(err);
        // this.onGetOpenid();
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
    let time = new Date().toLocaleString().substr(0, 10); //.split('/').join('-');
    // console.log(new Date().toLocaleDateString());
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
    console.log(arg.currentTarget.dataset.index);
    wx.navigateTo({
      url: '/pages/drawing/drawing?Image=' + arg.currentTarget.dataset.index,
      success: (result) => {
      },
      fail: (res) => {
        wx.showToast({
          title: 'failed' + res,
        });
        console.log(res);
      },
      complete: (res) => {},
    });
  },

  readDB: async function (){
    let database = wx.cloud.database();
    try {
      const res = await (database.collection('Graph').where({
        // _openid: this.data.uuid,
        _openid: app.globalData.openid,
      }).get())
      console.log(res)
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
    // await database.collection('Graph').where({
    //   // _openid: this.data.uuid,
    //   _openid: app.globalData.openid,
    // }).get({
    //   success: res => {
    //     this.setData({
    //       figureList: res.data,
    //       number: res.data.length,
    //     });
    //   },
    //   fail: err => {
    //     wx.showToast({
    //       icon: 'none',
    //       title: 'Loading Failed.'
    //     })
    //     console.error(err)
    //   }
    // });
  },

  initPreview: function(){
    //console.log(this.data.number)
    //console.log(this.data.figureList[0])
    for (var item in this.data.figureList){
      console.log(this.data.figureList[item])
      this.drawPreview(item)
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // Fetch User Information.
    if (null == app.globalData.openid) {
      this.onGetOpenid();
    }

    var a = new Array(3)
    a[0] = 0
    a[1] = 1
    a[2] = 2
    console.log(a)
    
    // Fetch System Information.
    let that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowHeight: res.windowHeight,
          navbarHeight: res.navbarHeight,
          headerHeight: res.navbarHeight,
          windowWidth: res.windowWidth,
        });
      }
    });

    let scrollHeight = this.data.windowHeight - this.data.titlesHeight;

    this.setData({
        scrollViewHeight: scrollHeight
    });


    // let database = wx.cloud.database();
    // database.collection('Graph').where({
    //   // _openid: this.data.uuid,
    //   _openid: app.globalData.openid,
    // }).get({
    //   success: res => {
    //     this.setData({
    //       figureList: res.data,
    //       number: res.data.length,
    //     });
    //   },
    //   fail: err => {
    //     wx.showToast({
    //       icon: 'none',
    //       title: 'Loading Failed.'
    //     })
    //     console.error(err)
    //   }
    // });

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
          // this.data.canvas = res[0].node
          console.log(index)
          //console.log(this.data.figureList[index]['grap'])
          var patterns = this.data.figureList[index]['grap']
          if (!patterns) return
          //console.log(patterns)
          // this.data.canvas.width = this.data.windowWidth.toString()
          // this.data.canvas.height = (this.data.scrollViewHeight*this.data.windowWidth/750).toString()
          // console.log(this.data.canvas.width, this.data.canvas.height)
          var canvas = res[0].node
          canvas.width = 0.44 * this.data.windowWidth
          canvas.height = 200
          this.drawAllObjects(res[0].node, patterns)
          // console.log("res:", res)
          //console.log(canvas)
          // console.log(this.data.canvas)
        })
  },
  
  getImageRange: function(patterns, ctx){
    var left, right, bottom, top
    for (var index in patterns){
      var pattern = patterns[index]
      if(!pattern) continue
      console.log(pattern)
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
    // return patterns.reduce((total, value) => {
    //   if(value.type == this.data.SHAPE.ARROW){
    //     var {left, right, bottom, top} = value.path.reduce((total, value) => {
    //       return {
    //         left: total.left <= value.x ? total.left : value.x,
    //         right: total.right >= value.x ? total.right : value.x,
    //         top: total.top <= value.y ? total.top : value.y,
    //         bottom: total.bottom >= value.y ? total.bottom : value.y,
    //       }
    //     })
    //   }
    //   else {
    //     var left = value.realX - value.width / 2
    //     var right = value.realX + value.width / 2
    //     var top = value.realY - value.height / 2
    //     var bottom = value.realY + value.height / 2
    //   }
    //   console.log(left, right, top, bottom)
    //   return {
    //     left: total.left <= left ? total.left : left,
    //     right: total.right >= right ? total.right : right,
    //     top: total.top <= top ? total.top : top,
    //     bottom: total.bottom >= bottom ? total.bottom : bottom,
    //   }
    // }, {left: undefined, right: undefined, left: undefined, right: undefined})
  },

  drawAllObjects: function(canvas, patterns){
    const ctx = canvas.getContext("2d")
    ctx.save()
    var range = this.getImageRange(patterns, ctx)
    //console.log(canvas)
    console.log(range)
    console.log(this.data.windowWidth * 0.44, canvas.height)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.translate(-range.left, -range.top)
    var scaleX = this.data.windowWidth * 0.44 / (range.right - range.left)
    var scaleY = canvas.height / (range.bottom - range.top)
    var scale //= Math.min(this.data.windowWidth * 0.44 / (range.right - range.left), canvas.height / (range.bottom - range.top))
    if (scaleX < scaleY){
      ctx.translate(0, (canvas.height - scaleX * (range.bottom - range.top)) / 2)
      scale = scaleX
    }
    else {
      ctx.translate((this.data.windowWidth * 0.44 - scaleY * (range.right - range.left)) / 2, 0)
      scale = scaleY
    }
    ctx.scale(scale, scale)
    console.log(ctx)
    for (var i = 0; i < patterns.length; i++) {
      if(!patterns[i]) continue
      this.drawObject(patterns[i], ctx)
    }
  },

  drawObject: function(obj, ctx){
    //console.log(obj)
    const AXE = {X: true, Y: false}
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
      console.log(startX, startY)
      for(var point = 0; point < obj.path.length; point++){
        ctx.lineTo(obj.path[point].x, obj.path[point].y)
        console.log(obj.path[point])
      }
      ctx.lineTo(endX, ndY)
      console.log(endX, endY)
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
      if (obj.type == this.data.SHAPE.SQUARE) {
        var objX = obj.realX - obj.width / 2
        var objY = obj.realY - obj.height / 2
        ctx.strokeRect(objX, objY, obj.width, obj.height)
      }
      else if (obj.type == this.data.SHAPE.TEXT) {
        ctx.font = obj.size + "pt Calibri"
        var objX = obj.realX - ctx.measureText(obj.text).width / 2
        var objY = obj.realY + obj.size / 2
        ctx.fillText(obj.text, objX, objY)
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
  },

})
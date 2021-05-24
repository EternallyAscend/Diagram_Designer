// miniprogram/pages/drawing/drawing.js
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
    patterns: [],
    paintMode: 0, // SHAPE->SELECT
    boardScale: 1,
    boardX: 0,
    boardY: 0,
    selected: null,
    canvas: null,
    DIRECTION: {
      RIGHT: 1,
      UP: 2,
      LEFT: 3,
      DOWN: 4,
    },
    graphId: null,
    editable: true,
    texts: false,
    // textContent: "",
    name: "Loading",
    desc: "",
    titlesHeight: 50,
    headBar: 80,
    bottomBar: 80,
    windowWidth: 0,
    windowHeight: 0,
    navbarHeight: 0,
    headerHeight: 0,
    scrollViewHeight: 0,
    saving: null,
    imagePath: "",
    x: 0,
    y: 0,
    gap: 10,
    zoom: 100,
  },

  arrow_drawing_cache: {
    touch: null,
    start: null,
    startDirection: null,
    end: null,
    endDirection: null,
    lastX: null,
    lastY: null,
  },

  readImage: function(id) {
    const db = wx.cloud.database();
    db.collection('Graph').doc(id).get({
      success: res => {
        wx.showToast({
          title: res.data,
        })
        if (res._id != app.globalData.openid) {
          this.setData({
            editable: false,
          })
          // db.collection("SharingMap").where({
          //   graph_id: id,
          //   user_id: app.globalData.openid,
          // }).get({
          //   success: resi => {
          //     this.setData({
          //       editable: resi.data.editable,
          //     });
          //   },
          //   fail: err => {
          //     wx.showToast({
          //       icon: 'none',
          //       title: 'No Auth.',
          //     });
          //     return;
          //   },
          // })
        }
        this.data.patterns.push(...(res.data.garp != undefined ? res.data.garp : []))
        this.setData({
          name: res.data.name,
          desc: res.data.desc,
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
          title: 'save failed title',
        })
      }
    })
  },

  deleteFigure: function() {
    if (((this.data.graphId != null) && this.data.editable)) {
    // wx.showModal({
    //   title: ""+this.data.graphId,
    //   content: ""+((this.data.graphId != null) && this.data.editable),
    //   cancelColor: 'cancelColor',
    // })
    
      wx.showModal({
        title: 'Remove',
        content: 'Confirm Delete This Image?',
        showCancel: true,
        cancelText: 'Cancel',
        cancelColor: '#000000',
        confirmText: 'Confirm',
        confirmColor: '#3CC51F',
        success: (result) => {
          if(result.confirm){
            wx.showToast({
              title: 'OK',
            })
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
              title: 'Else',
            })
            return;
          }
        },
        fail: ()=>{
          wx.showToast({
            title: 'Failed',
          })
          return;
        },
        complete: ()=>{}
      });
    } else {
      wx.showToast({
        title: 'Not a Record.',
      });
    }
  },

  showDescription: function() {
    wx.showToast({
      icon: 'none',
      image: '../../icon/info_filled.png',
      title: this.data.desc,
    })
  },

  printSavedFigure: function() {
    // let cc = wx.createCanvasContext('save');
    // Drawing Contents.

    // Drawing Finish.
    // cc.drawImage
    // cc.draw
    if (this.data.patterns == []) {
      wx.showToast({
        title: 'Empty Figure',
      })
      return;
    }

    var t = 0;
    var b = 0;
    var l = 0;
    var r = 0;
    for(var i = 0; i < this.data.patterns.length; i++){
      t = t > this.data.patterns[i].realY - this.data.patterns[i].height / 2 ? this.data.patterns[i].realY - this.data.patterns[i].height / 2 : t
      b = b < this.data.patterns[i].realY + this.data.patterns[i].height / 2 ? this.data.patterns[i].realY + this.data.patterns[i].height / 2 : b
      l = l > this.data.patterns[i].realX - this.data.patterns[i].width / 2 ? this.data.patterns[i].realX - this.data.patterns[i].width / 2 : l
      r = r < this.data.patterns[i].realX + this.data.patterns[i].width / 2 ? this.data.patterns[i].realX + this.data.patterns[i].width / 2 : r
    }
    var oldX = this.data.boardX;
    var oldY = this.data.boardY;
    var oldS = this.data.boardScale;

    const query = wx.createSelectorQuery();
    query.select("#save")
      .fields({node: true, size: true})
      .exec((res)=>{
        // this.data.canvas = res[0].node
        this.setData({
          saving: res[0].node,
          boardX: r - l,
          boardY: b - t,
          boardScale: 1,
        })
        this.data.canvas.width = (r - l).toString()
        this.data.canvas.height = (b - t).toString()
        this.test()
        // console.log(res[0])
        // console.log(res[0].node)
        // console.log(this.data.canvas)
        const ctx = this.data.saving.getContext("2d")
        // console.log(ctx)
        ctx.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height)
        
        for(var i = 0; i < this.data.patterns.length; i++){
          this.drawObject(this.data.patterns[i], ctx)
        }
    
        this.setData({
          boardX: oldX,
          boardY: oldY,
          boardScale: oldS,
        })
      })

    setTimeout(function() {
      wx.canvasToTempFilePath({
          canvasId: 'save',
          success: function(res) {
              that.setData({
                  imagePath: res.tempFilePath,
              });
          },
          fail: function(res) {
              console.log(res);
          }
      });
    }, 500);
  },

  saveFigureToFileSystem: function() {
    this.printSavedFigure();
    wx.saveImageToPhotosAlbum({
        filePath: this.data.imagePath,
        success(res) {
            console.log('res', res);
            wx.showToast({
                title: 'Saved!',
                icon: 'success',
                duration: 3000
            });
        }
    });
  },

  setShapeType: function(arg) {
    if ((arg.currentTarget.dataset.type == this.data.SHAPE.TEXT) && (this.data.selected != null)) {
      this.setData({
        paintMode: arg.currentTarget.dataset.type,
        texts: true,
      })
    } else {
      this.setData({
        paintMode: arg.currentTarget.dataset.type,
        selected: null,
      });
    }
    // wx.showToast({
    //   // title: this.data.paintMode,
    //   title: ""+arg.currentTarget.dataset.type,
    // })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    
    // Fetch System Information.
    var that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight,
        });
      }
    });

    // let scrollHeight = this.data.windowHeight - this.data.titlesHeight - this.data.headBar - this.data.bottomBar;
    let scrollHeight = 750 / this.data.windowWidth * this.data.windowHeight - this.data.titlesHeight - this.data.headBar - this.data.bottomBar - 45;

    this.setData({
        scrollViewHeight: scrollHeight
    });

    this.setData({
      graphId: options.Image,
    });
    
    // this.saveFigure();
    // this.deleteFigure();

    
    const query = wx.createSelectorQuery();
    query.select("#Canvas")
      .fields({node: true, size: true})
      .exec((res)=>{
        // this.data.canvas = res[0].node
        this.readImage(this.data.graphId);
        this.setData({
          canvas: res[0].node
        })
        this.data.canvas.width = this.data.windowWidth.toString()
        this.data.canvas.height = (this.data.scrollViewHeight*this.data.windowWidth/750).toString()
        this.test()
        //console.log("res:", res)
        //console.log(res[0])
        //console.log(this.data.canvas)
      })

  },

  setContent: function(arg) {
    this.setData({
      text: arg.detail.value,
    })
  },

  createTexts: function() {
    this.setData({
      texts: false,
      text: "",
    })
  },

  cancelCreateTexts: function() {
    this.setData({
      texts: false,
      text: "",
    })
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
    if (this.data.id) {
      this.saveFigure();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.data.id) {
      this.saveFigure();
    }
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
    wx.showShareMenu({
      withShareTicket: true,
    });
  },

  originFigure: function () {
    
  },

  zoomIn: function() {

  },

  zoomOut: function() {

  },

  deleteElementSelected: function() {
    if (this.data.selected == null) {
      wx.showToast({
        icon: 'none',
        image: '../../icon/info_filled.png',
        title: 'Not selected.',
      })
    }
  },

  moveHorizon: function(arg) {
    this.setData({
      x: this.data.x + this.data.zoom * arg.currentTarget.dataset.step,
    });
  },

  moveVertical: function(arg) {
    this.setData({
      y: this.data.y + this.data.zoom * arg.currentTarget.dataset.step,
    });
  },
  
  createPattern: function(x, y, type) {
    this.data.patterns.push({
      realX: x,
      realY: y,
      height: 50,
      width: 80,
      type: type,
      arrows: [],
    })
  },

  createText: function(x, y, text) {
    this.data.patterns.push({
      realX: x,
      realY: y,
      size: 14,
      type: this.data.SHAPE.TEXT,
      text: text,
    })
  },

  createArrow: function({start, end, startDirection, endDirection}){
    var arrow = this.adjustArrow({
      start: start,
      startDirection: startDirection,
      end: end,
      endDirection: endDirection,
      type: this.data.SHAPE.ARROW,
      path: [],
    })
    console.log(start)
    console.log(end)
    start.arrows.push({arrow, startDirection})
    end.arrows.push({arrow, endDirection})
    //this.adjustArrow(arrow)
    this.data.patterns.push(arrow)
  },

  getCorner: function (a, b){
    if(a.hz && !b.hz){
      return {x: a.pos, y: b.pos}
    }
    else if (!a.hz && b.hz){
      return {x: b.pos, y: a.pos}
    }
  },

  adjustArrow: function(arrow){
    const POS_COR = {
      OUTERSTART: 0,
      CENTERSTART: 1,
      INNERSTART: 2,
      CENTER: 3,
      INNRTEND: 4,
      CENTEREND: 5,
      OUTEREND: 6,
    }
    arrow.path = []
    // var dir = startDirection
    // var hz
    // hz = dir % 2
    // var end
    // var x = arrow.start.x - arrow.start.width / 2, y = arrow.start.y - arrow.start.height / 2
    // arrow.path.push({x: x, y: y})
    // // var path = {hz: hz, pos: dir?arrow.start.height / 2 : arrow.start.width / 2}
    // // arrow.path.push(path)
    // // if (hz){

    // // }
    // if(hz){
    //   if(direction == DIRECTION.RIGHT) x += 10
    //   else x -= 10
    //   arrow.path.push({x: x, y: y})
    //   if()
    // }
    //var vertical = []
    //var horizon = []
    var left, up
    left = (arrow.start.realX - arrow.start.width / 2) < (arrow.end.realX - arrow.end.width / 2)
    up = (arrow.start.realY - arrow.start.height / 2) < (arrow.end.realY - arrow.end.height / 2)
    var parellel = !((arrow.startDirection + arrow.endDirection) % 2)                       // 起始方向与末尾方向平行
    var startOut = (left?arrow.startDirection == this.data.DIRECTION.LEFT:arrow.startDirection == this.data.DIRECTION.RIGHT) ||
      (up?arrow.startDirection == this.data.DIRECTION.UP:arrow.startDirection == this.data.DIRECTION.DOWN)      // 起始方向内\外
    var endOut = (left?arrow.endDirection == this.data.DIRECTION.RIGHT:arrow.endDirection == this.data.DIRECTION.LEFT) ||
      (up?arrow.endDirection == this.data.DIRECTION.DOWN:arrow.endDirection == this.data.DIRECTION.UP)          // 末尾方向内\外
    var grid = this.getArrowGrid(arrow, left, up)
    var isTransfered = !(arrow.startDirection % 2)                                          // 斜对称
    var trans = (x, y)=>{
      if(isTransfered){
        return {x: grid.horizon[y], y: grid.vertical[x]}
      }
      else return {x: grid.horizon[x], y: grid.vertical[y]}
    }

    console.log("left ",left, " up ", up, " parellel ", parellel, " startOut ", startOut, " endOut ", endOut)
    
    if(startOut){
      arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTERSTART))
      if(endOut){
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTEREND))
          console.log("startOut endOut parellel")
        }
        else{
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.OUTEREND))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.OUTEREND))
          console.log("startOut endOut !parellel")
        }
      }
      else {
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTEREND))
          console.log("startOut !endOut parellel")
        }
        else{
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.CENTER))
          console.log("startOut !endOut !parellel")
        }
      }
    }
    else{
      if(endOut){
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTEREND))
          console.log("!startOut endOut parellel")
        }
        else{
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.OUTEREND))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.OUTEREND))
          console.log("!startOut endOut !parellel")
        }
      }
      else{
        if(parellel){
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTEREND))
          console.log("!startOut !endOut parellel")
        }
        else{
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.CENTERSTART))
          console.log("!startOut !endOut !parellel")
        }
      }
    }
    return arrow
  },

  getArrowGrid(arrow, left, up){
    var horizon = [arrow.start.realX - arrow.start.width/2 - 10, arrow.start.realX, arrow.start.realX + arrow.start.width/2 + 10]
    var tail = [arrow.end.realX - arrow.end.width/2 - 10, arrow.end.realX, arrow.end.realX + arrow.end.width/2 + 10]
    if(!left) {
      horizon.reverse()
      tail.reverse()
    }
    horizon.push((arrow.start.realX + arrow.end.realX) / 2)
    horizon.splice(4, 0, ...tail)

    var vertical = [arrow.start.realY - arrow.start.height/2 - 10, arrow.start.realY, arrow.start.realY + arrow.start.height/2 + 10]
    tail = [arrow.end.realY - arrow.end.height/2 - 10, arrow.end.realY, arrow.end.realY + arrow.end.height/2 + 10]
    if(!up) {
      vertical.reverse()
      tail.reverse()
    }
    vertical.push((arrow.start.realY + arrow.end.realY) / 2)
    vertical.splice(4, 0, ...tail)

    console.log(horizon)
    console.log(vertical)
    return {horizon: horizon, vertical: vertical}

    // horizon.push(left?arrow.start.x - arrow.start.width/2 - 10:arrow.start.x + arrow.start.width/2 + 10)
    // horizon.push(arrow.start.x)
    // horizon.push(left?arrow.start.x + arrow.start.width/2 + 10:arrow.start.x - arrow.start.width/2 - 10)
    // horizon.push((arrow.start.x + arrow.end.x) / 2)
    // horizon.push(left?arrow.end.x - arrow.end.width/2 - 10:arrow.end.x + arrow.end.width/2 + 10)
    // horizon.push(arrow.start.x)
    // horizon.push(left?arrow.end.x + arrow.end.width/2 + 10:arrow.end.x - arrow.end.width/2 - 10)

    // vertical.push(up?arrow.start.y - arrow.start.height/2 - 10:arrow.start.y + arrow.start.height/2 + 10)
    // vertical.push(arrow.start.y)
    // vertical.push(up?arrow.start.y + arrow.start.height/2 + 10:arrow.start.y - arrow.start.height/2 - 10)
    // vertical.push((arrow.start.y + arrow.end.y) / 2)
    // vertical.push(up?arrow.end.y - arrow.end.height/2 - 10:arrow.end.y + arrow.end.height/2 + 10)
    // vertical.push(arrow.start.y)
    // vertical.push(up?arrow.end.y + arrow.end.height/2 + 10:arrow.end.y - arrow.end.height/2 - 10)
  },

  findObject: function(x, y){
    // var mapCor = (cor, axe)=>{
    //   if(axe) return (cor - this.data.boardX)*this.data.boardScale
    //   else return (cor - this.data.boardY)*this.data.boardScale
    // }
    //console.log(this.data.patterns.findIndex)
    var findInPatterns = (value, index, array)=>{
      console.log(x, y, value)
      if(value.type == this.data.SHAPE.TEXT){
        //var metrics =cvsCtx.measureText();
        return false
      }
      if(value.type == this.data.SHAPE.ARROW){
        return false
      }
      else{
        return this.isInPattern(x, y, value)
      }
    }
    var index = this.data.patterns.findIndex(findInPatterns)
    console.log(index)
    return index
  },

  selectObject: function(x, y){
    //console.log(this.data.patterns)
    var selectedIndex = this.findObject(x, y)
    console.log(selectedIndex, x, y)
    if (selectedIndex==-1){
      this.data.selected = null
    }
    else{
      this.data.patterns.push(this.data.patterns.splice(selectedIndex, 1)[0])
      this.data.selected = this.data.patterns[this.data.patterns.length - 1]
    }
    console.log(this.data.selected)
    console.log(this.data.patterns)
  },

  // drawSelection: function(ctx){
  //   switch(ctx){
  //     case this.data.SHAPE.SQUARE:
  //     case this.data.SHAPE.TEXT:
  //     case this.data.SHAPE.ARROW: 
  //   }
  // },

  drawAllObjects: function(){
    const ctx = this.data.canvas.getContext("2d")
    console.log(ctx)
    ctx.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height)
    for (var i = 0; i < this.data.patterns.length; i++) {
      this.drawObject(this.data.patterns[i], ctx, this.data.patterns[i] == this.data.selected)
    }
  },

  drawObject: function(obj, ctx, selected=false){
    console.log(obj)
    const AXE = {X: true, Y: false}
    var mapCor = (cor, axe)=>{
      if(axe) return (cor - this.data.boardX)*this.data.boardScale
      else return (cor - this.data.boardY)*this.data.boardScale
    }
    if(selected) {
      ctx.setLineDash([2,2])
    }
    else {
      ctx.setLineDash([])
    }
    // var mapCor = (x, y) => {
    //   return x
    // }
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
          startX = obj.start.realX - obj.start.width / 2
          startY = obj.start.realY
          break
        case this.data.DIRECTION.RIGHT:
          startX = obj.start.realX + obj.start.width / 2
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
          endX = obj.end.realX - obj.end.width / 2
          endY = obj.end.realY
          break
        case this.data.DIRECTION.RIGHT:
          endX = obj.end.realX + obj.end.width / 2
          endY = obj.end.realY
          break
      }
      //console.log("an arrow")
      ctx.beginPath()
      ctx.moveTo(mapCor(startX, AXE.X), mapCor(startY, AXE.Y))
      console.log(startX, startY)
      for(var point = 0; point < obj.path.length; point++){
        ctx.lineTo(mapCor(obj.path[point].x, AXE.X), mapCor(obj.path[point].y, AXE.Y))
        console.log(obj.path[point])
      }
      ctx.lineTo(mapCor(endX, AXE.X), mapCor(endY, AXE.Y))
      console.log(endX, endY)
      ctx.stroke()
      //ctx.draw()
      ctx.beginPath()
      ctx.moveTo(mapCor(endX, AXE.X), mapCor(endY, AXE.Y))
      switch(obj.endDirection){
        case this.data.DIRECTION.UP:
          ctx.lineTo(mapCor(endX - 2, AXE.X), mapCor(endY - 3, AXE.Y))
          ctx.lineTo(mapCor(endX + 2, AXE.X), mapCor(endY - 3, AXE.Y))
          break
        case this.data.DIRECTION.DOWN:
          ctx.lineTo(mapCor(endX - 2, AXE.X), mapCor(endY + 3, AXE.Y))
          ctx.lineTo(mapCor(endX + 2, AXE.X), mapCor(endY + 3, AXE.Y))
          break
        case this.data.DIRECTION.RIGHT:
          ctx.lineTo(mapCor(endX + 3, AXE.X), mapCor(endY - 2, AXE.Y))
          ctx.lineTo(mapCor(endX + 3, AXE.X), mapCor(endY + 2, AXE.Y))
          break
        case this.data.DIRECTION.LEFT:  
          ctx.lineTo(mapCor(endX - 3, AXE.X), mapCor(endY + 2, AXE.Y))
          ctx.lineTo(mapCor(endX - 3, AXE.X), mapCor(endY - 2, AXE.Y))
          break
      }
      ctx.closePath()
      ctx.fill()
    }
    else {
      if (obj.type == this.data.SHAPE.SQUARE) {
        var objX = mapCor(obj.realX - obj.width / 2, AXE.X)
        var objY = mapCor(obj.realY - obj.height / 2, AXE.Y)
        ctx.strokeRect(objX, objY, obj.width*this.data.boardScale, obj.height*this.data.boardScale)
        console.log(obj.width*this.data.boardScale)
        console.log(obj.height*this.data.boardScale)
      }
      else if (obj.type == this.data.SHAPE.TEXT) {
        var objX = mapCor(obj.realX - ctx.measureText(obj.text).width / 2, AXE.X)
        var objY = mapCor(obj.realY + obj.size / 2, AXE.Y)
        if(selected){
          ctx.strokeRect(objX, mapCor(obj.realY - obj.size / 2, AXE.Y))
        }
        //ctx.font = obj.size + "px SimHei"
        ctx.fillText(obj.text, objX, objY)
        //ctx.draw()
      }
      else if (obj.type == this.data.SHAPE.DIAMOND) {
        ctx.beginPath()
        ctx.moveTo(mapCor(obj.realX - obj.width / 2, AXE.X), mapCor(obj.realY, AXE.Y))
        ctx.lineTo(mapCor(obj.realX , AXE.X), mapCor(obj.realY - obj.height / 2, AXE.Y))
        ctx.lineTo(mapCor(obj.realX + obj.width / 2, AXE.X), mapCor(obj.realY, AXE.Y))
        ctx.lineTo(mapCor(obj.realX , AXE.X), mapCor(obj.realY + obj.height / 2, AXE.Y))
        ctx.closePath()
        ctx.stroke()
      }
      else if (obj.type == this.data.SHAPE.PARALLELOGRAM) {
        ctx.beginPath()
        ctx.moveTo(mapCor(obj.realX - obj.width / 2, AXE.X), mapCor(obj.realY - obj.height / 2, AXE.Y))
        ctx.lineTo(mapCor(obj.realX + obj.width / 4, AXE.X), mapCor(obj.realY - obj.height / 2, AXE.Y))
        ctx.lineTo(mapCor(obj.realX + obj.width / 2, AXE.X), mapCor(obj.realY + obj.height / 2, AXE.Y))
        ctx.lineTo(mapCor(obj.realX - obj.width / 4, AXE.X), mapCor(obj.realY + obj.height / 2, AXE.Y))
        ctx.closePath()
        ctx.stroke()
      }
      else if (obj.type == this.data.SHAPE.ELLIPSE) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(mapCor(obj.realX - obj.width / 2, AXE.X), mapCor(obj.realY, AXE.Y))
        const d = obj.width > obj.height ? obj.width : obj.height
        const radioX = obj.width / d  //* this.data.boardScale
        const radioY = obj.height / d  //* this.data.boardScale
        ctx.scale(radioX, radioY)
        ctx.arc(mapCor(obj.realX / radioX, AXE.X), mapCor(obj.realY / radioY, AXE.Y), d / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.restore()
        ctx.stroke()
      }
    }
  },


  onTouchCanvas: function(event){
    console.log(event)
    switch(this.data.paintMode){
      case this.data.SHAPE.SELECT:
        this.selectObject(event.touches[0].x, event.touches[0].y)
        break
      case this.data.SHAPE.SQUARE:
      case this.data.SHAPE.ELLIPSE:
      case this.data.SHAPE.PARALLELOGRAM:
      case this.data.SHAPE.DIAMOND:
        this.createPattern(event.touches[0].x, event.touches[0].y, this.data.paintMode)
        break
      case this.data.SHAPE.ARROW:
        var index = this.findObject(event.touches[0].x, event.touches[0].y)
        if(index != -1){
          this.arrow_drawing_cache.touch = event.touches[0].identifier
          this.arrow_drawing_cache.start = this.data.patterns[index]
          this.arrow_drawing_cache.lastX = event.touches[0].x
          this.arrow_drawing_cache.lastY = event.touches[0].y
        }
        console.log(this.arrow_drawing_cache)
        break
    }
    this.drawAllObjects()
  },

  onTouchMoveCanvas: function(event){
    //console.log(event)
    switch (this.data.paintMode){
      case this.data.SHAPE.ARROW:
        var touch
        if (this.arrow_drawing_cache.start) {
          for (var i = 0; i < event.touches.length; i++){
            if (event.touches[i].identifier == this.arrow_drawing_cache.touch){
              touch = event.touches[i]
              break
            }
          }
        }
        if (touch){
          if(this.arrow_drawing_cache.startDirection == null){
            var x = touch.x, y = touch.y
            if (!this.isInPattern(x, y, this.arrow_drawing_cache.start) 
            && this.isInPattern(this.arrow_drawing_cache.lastX, this.arrow_drawing_cache.lastY, this.arrow_drawing_cache.start)){
              if (y > this.mapCor(this.arrow_drawing_cache.start.realY + this.arrow_drawing_cache.start.height / 2, this.AXE.Y)){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.DOWN
              }
              else if (x > this.mapCor(this.arrow_drawing_cache.start.realX + this.arrow_drawing_cache.start.width / 2, this.AXE.X)){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.RIGHT
              }
              else if (y < this.mapCor(this.arrow_drawing_cache.start.realY - this.arrow_drawing_cache.start.height / 2, this.AXE.Y)){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.UP
              }
              else if (x < this.mapCor(this.arrow_drawing_cache.start.realX - this.arrow_drawing_cache.start.width / 2, this.AXE.X)){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.LEFT
              }
            }
            else {
              this.arrow_drawing_cache.lastX = touch.x
              this.arrow_drawing_cache.lastY = touch.y
            }
          }
        }
        console.log(this.arrow_drawing_cache)
    }
  },

  onTouchEndCanvas: function(event) {
    console.log(event)
    switch(this.data.paintMode){
      case this.data.SHAPE.ARROW:
        var touch
        for (var i = 0; i < event.changedTouches.length; i++){
          if (event.changedTouches[i].identifier == this.arrow_drawing_cache.touch){
            touch = event.changedTouches[i]
            break
          }
        }
        if (touch){
          console.log("touch:", touch)
          var x = touch.x, y = touch.y
          console.log("x ", x, "y ", y)
          var end = this.data.patterns[this.findObject(x, y)]
          console.log("mapCor(end.realY, this.AXE.Y) ", this.mapCor(end.realY, this.AXE.Y))
          this.arrow_drawing_cache.end = end
          if(x >= this.mapCor(end.realX + end.width / 4, this.AXE.X)) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.RIGHT
            console.log("enddir right ", this.arrow_drawing_cache.endDirection)
          }
          else if (x <= this.mapCor(end.realX - end.width / 4, this.AXE.X)) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.LEFT
            console.log("enddir left ",this.arrow_drawing_cache.endDirection)
          }
          else if (y >= this.mapCor(end.realY, this.AXE.Y)) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.DOWN
            console.log("enddir down ",this.arrow_drawing_cache.endDirection)
          }
          //else if (y > this.mapCor(end.realY, this.AXE.Y)) 
          else{
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.UP
            console.log("enddir up ", this.arrow_drawing_cache.endDirection)
          }
          console.log(this.arrow_drawing_cache)
          this.createArrow(this.arrow_drawing_cache)
          this.drawAllObjects()
        }
        this.resetArrowTouchCache()
    }
  },

  mapCor: function(cor, axe){
      if(axe) return (cor - this.data.boardX)*this.data.boardScale
      else return (cor - this.data.boardY)*this.data.boardScale
  },

  AXE: {X: true, Y: false},

  isInPattern: function(x, y, pattern) {
    return x > this.mapCor(pattern.realX - pattern.width / 2 , this.AXE.X)
      && x < this.mapCor(pattern.realX + pattern.width / 2, this.AXE.X)
      && y > this.mapCor(pattern.realY - pattern.height / 2, this.AXE.Y)
      && y < this.mapCor(pattern.realY + pattern.height / 2, this.AXE.Y)
  },

  resetArrowTouchCache: function(){
    this.arrow_drawing_cache = {
      touch: null,
      start: null,
      startDirection: null,
      end: null,
      endDirection: null,
      lastX: null,
      lastY: null,
    }
  },

  editText: function(str){
    if(this.data.selected){
      if (this.data.selected.type == this.data.SHAPE.ARROW) return 
      this.data.selected.text = str
    }
  },

  test: function(){
    //console.log(this.data.canvas)
    this.createPattern(20, 20, this.data.SHAPE.SQUARE)
    this.createPattern(100, 100, this.data.SHAPE.SQUARE)
    this.createText(20, 100, "abc")
    // this.createArrow(
    //   {
    //     start: this.data.patterns[0], 
    //     end: this.data.patterns[1], 
    //     startDirection: this.data.DIRECTION.RIGHT, 
    //     endDirection: this.data.DIRECTION.LEFT})
      
    this.createPattern(50, 140, this.data.SHAPE.SQUARE)
    this.createPattern(200, 250, this.data.SHAPE.SQUARE)
    this.drawAllObjects()
  }
})
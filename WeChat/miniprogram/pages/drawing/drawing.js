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
      TOP: 2,
      LEFT: 3,
      DOWN: 4,
    },
    graphId: null,
    editable: true,
    name: "Loading",
    desc: "",
    titlesHeight: 50,
    headBar: 90,
    bottomBar: 90,
    windowWidth: 0,
    windowHeight: 0,
    navbarHeight: 0,
    headerHeight: 0,
    scrollViewHeight: 0,
    saving: false,
    imagePath: "",
    x: 0,
    y: 0,
    gap: 10,
    zoom: 100,
    selectedElement: null,
  },

  readImage: function(id) {
    const db = wx.cloud.database();
    db.collection('Graph').doc(id).get({
      success: res => {
        wx.showToast({
          title: res.data,
        })
        if (res._id != app.globalData.openid) {
          db.collection("SharingMap").where({
            graph_id: id,
            user_id: app.globalData.openid,
          }).get({
            success: resi => {
              this.setData({
                editable: resi.data.editable,
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
          patterns: res.data.garp,
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

  showDescription: function() {
    wx.showToast({
      icon: 'none',
      image: '../../icon/info_filled.png',
      title: this.data.desc,
    })
  },

  printSavedFigure: function() {
    let cc = wx.createCanvasContext('save');
    // Drawing Contents.

    // Drawing Finish.
    // cc.drawImage
    // cc.draw
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
    printSavedFigure();
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
    this.setData({
      paintMode: arg.currentTarget.dataset.type,
      selectedElement: null,
    });
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
    this.readImage(this.data.graphId);
    
    // this.saveFigure();
    // this.deleteFigure();

    
    const query = wx.createSelectorQuery();
    query.select("#Canvas")
      .fields({node: true, size: true})
      .exec((res)=>{
        // this.data.canvas = res[0].node
        this.setData({
          canvas: res[0].node
        })
        this.data.canvas.width = this.data.windowWidth.toString()
        this.data.canvas.height = (this.data.scrollViewHeight*this.data.windowWidth/750).toString()
        this.test()
        // console.log(res[0])
        // console.log(res[0].node)
        // console.log(this.data.canvas)
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

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // if (this.data.id) {
    //   this.saveFigure();
    // }
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

  zoomIn: function() {

  },

  zoomOut: function() {

  },

  deleteElementSelected: function() {
    if (this.data.selectedElement == null) {
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
      content: text,
      arrows: [],
    })
  },

  createArrow: function(start, end, startDirection, endDirection){
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
        return {x: grid.vertical[y], y: grid.horizon[x]}
      }
      else return {x: grid.horizon[x], y: grid.vertical[y]}
    }

    
    if(startOut){
      arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTERSTART))
      if(endOut){
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTEREND))
        }
        else{
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.OUTEREND))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.OUTEREND))
        }
      }
      else {
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTEREND))
        }
        else{
          arrow.path.push(trans(POS_COR.OUTERSTART, POS_COR.CENTER))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.CENTER))
        }
      }
    }
    else{
      if(endOut){
        if(parellel){
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.OUTEREND, POS_COR.CENTEREND))
        }
        else{
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.OUTEREND))
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.OUTEREND))
        }
      }
      else{
        if(parellel){
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTERSTART))
          arrow.path.push(trans(POS_COR.INNERSTART, POS_COR.CENTEREND))
        }
        else{
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.CENTERSTART))
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

  selectObject: function(x, y){
    var selectedIndex = this.data.patterns.findIndex((value, index, array)=>{
      return x > value.realX 
        && x < value.realX + value.width
        && y > value.realY
        && y < value.realY + value.height
    })
    if (selectedIndex==-1){
      this.data.selected = null
    }
    else{
      this.data.patterns.push(this.data.patterns.splice(selectedIndex, 1)[0])
      this.data.selected = this.data.patterns[this.data.patterns.length - 1]
    }
  },

  drawAllObjects: function(){
    const ctx = this.data.canvas.getContext("2d")
    console.log(ctx)
    ctx.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height)
    for(var i = 0; i < this.data.patterns.length; i++){
      this.drawObject(this.data.patterns[i], ctx)
    }
  },

  drawObject: function(obj, ctx){
    console.log(obj)
    const AXE = {X: true, Y: false}
    // var mapCor = (cor, axe)=>{
    //   if(axe) return (cor - this.data.boardX)*this.data.boardScale
    //   else return (cor - this.data.boardY)*this.data.boardScale
    // }
    var mapCor = (x, y) => {
      return x
    }
    if (obj.type == this.data.SHAPE.ARROW){
      var startX, startY, endX, endY
      switch(obj.startDirection){
        case this.data.DIRECTION.UP:
          startX = obj.start.realX
          startY = obj.start.realY + obj.start.height / 2
          break
        case this.data.DIRECTION.DOWN:
          startX = obj.start.realX
          startY = obj.start.realY - obj.start.height / 2
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
          endY = obj.end.realY + obj.end.height / 2
          break
        case this.data.DIRECTION.DOWN:
          endX = obj.end.realX
          endY = obj.end.realY - obj.end.height / 2
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
      if(obj.type == this.data.SHAPE.SQUARE) {
        var objX = mapCor(obj.realX - obj.width / 2, AXE.X)
        var objY = mapCor(obj.realY - obj.height / 2, AXE.Y)
        ctx.strokeRect(objX, objY, obj.width*this.data.boardScale, obj.height*this.data.boardScale)
        console.log(obj.width*this.data.boardScale)
        console.log(obj.height*this.data.boardScale)
      }
      else if(obj.type == this.data.SHAPE.TEXT) {
        var objX = mapCor(obj.realX, AXE.X)
        var objY = mapCor(obj.realY, AXE.Y)
        //ctx.font = obj.size + "px SimHei"
        ctx.fillText(obj.content, objX, objY)
        //ctx.draw()
      }
    }
  },

  onTouchCanvas: function(event){
    switch(this.data.paintMode){
      case this.data.SHAPE.SELECT:
        this.selectObject(event.touches[0].pageX - this.data.canvas.left, event.touches[0].pageY - this.data.canvas.top)
        break
      case this.data.SHAPE.SQUARE:
        this.createPattern(event.touches[0].pageX - this.data.canvas.left, event.touches[0].pageY - this.data.canvas.top, this.data.paintMode)
        break
      
    }
    drawAllObjects()
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
    this.createArrow(this.data.patterns[0], this.data.patterns[1], this.data.DIRECTION.RIGHT, this.data.DIRECTION.LEFT)
    this.drawAllObjects()
  }
})
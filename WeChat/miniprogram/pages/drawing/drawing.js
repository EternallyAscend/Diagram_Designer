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
    boardScale: 1.0,
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
    openid: null,
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
        if (res._id != this.data.openid) {
          this.setData({
            editable: false,
          })
          // db.collection("SharingMap").where({
          //   graph_id: id,
          //   user_id: this.data.openid,
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
          patterns: res.data.grap,
          // queryResult: JSON.stringify(res.data, null, 2)
        });
        this.bindArrows()
        if (this.data.canvas) {
          this.drawAllObjects()
        }
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
        this.setData({
          openid: res.result.openid,
        })
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
        wx.showToast({
          title: 'Save OK!',
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Save failed.',
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
              title: 'Cancel.',
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
        title: 'No Permissions.',
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
        const ctx = this.data.saving.getContext("2d")
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
    if (null == this.data.openid) {
      this.onGetOpenid()
    }
    
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
      })
  },

  setContent: function(arg) {
    this.setData({
      text: arg.detail.value,
    })
  },

  createTexts: function() {
    if (this.data.selected) {
      this.data.selected.text=this.data.text
    } else {
      this.createText(this.data.x, this.data.y, this.data.text)
    }
    this.setData({
      texts: false,
      text: "",
    })
    this.reGetCanvas()
  },

  cancelCreateTexts: function() {
    this.setData({
      texts: false,
      text: "", // this.data.selected?this.data.selected.text:"",
    })
    this.reGetCanvas()
  },

  reGetCanvas: function(){
    const query = wx.createSelectorQuery();
    query.select("#Canvas")
      .fields({node: true, size: true})
      .exec((res)=>{
        // this.readImage(this.data.graphId);
        this.setData({
          canvas: res[0].node
        })
        this.data.canvas.width = this.data.windowWidth.toString()
        this.data.canvas.height = (this.data.scrollViewHeight*this.data.windowWidth/750).toString()
        this.drawAllObjects()
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
    // var pages = getCurrentPages();
    // var pageBack = pages[pages.length - 2]
    // pageBack.onLoad()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // var pages = getCurrentPages();
    // var pageBack = pages[pages.length - 2]
    // pageBack.onLoad()
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
    this.setData({
      boardScale: 1,
      boardX: 0,
      boardY: 0,
    })
    this.drawAllObjects()
  },

  bindArrows: function () {
    console.log(this.data.patterns)
    var arrows = this.data.patterns.filter((value) => {
      return value.type == this.data.SHAPE.ARROW
    })
    console.log(arrows)
    arrows.forEach((value) => {
      var arrow = value
      this.data.patterns.forEach((value)=>{
        if (value.uuid == arrow.start.uuid) arrow.start = value
        if (value.uuid == arrow.end.uuid) arrow.end = value
      })
    })
  },

  zoomIn: function() {
    // this.data.boardScale += 0.2
    if (this.data.boardScale >= 2) {
      return
    }
    this.setData({
      boardScale: (parseFloat(this.data.boardScale) + 0.2).toFixed(2)
    })
    this.drawAllObjects()
    return
  },

  zoomOut: function() {
    // this.data.boardScale -= 0.2
    if (this.data.boardScale <= 0.2) {
      return
    }
    this.setData({
      boardScale: (parseFloat(this.data.boardScale) - 0.2).toFixed(2)
    })
    this.drawAllObjects()
    return
  },

  deleteElementSelected: function() {
    if (this.data.selected == null) {
      wx.showToast({
        icon: 'none',
        image: '../../icon/info_filled.png',
        title: 'Not selected.',
      })
    } else {
      var pattern = this.data.selected
      this.data.selected = null
      var relatedIndex = []
      this.data.patterns.forEach((value, index) => {
        // console.log(value)
        console.log(value.type == this.data.SHAPE.ARROW && (value.start == pattern || value.end == pattern))
        if (value.type == this.data.SHAPE.ARROW) { 
          console.log(pattern)
          console.log(value.start)
          console.log(value.end)
          if (value.start.uuid == pattern.uuid || value.end.uuid == pattern.uuid){
            relatedIndex.push(index)
          }
        }
      })
      this.data.patterns.pop()
      console.log(relatedIndex)
      relatedIndex.reverse().forEach((value) => {
        this.data.patterns.splice(value, 1)
      })
      this.drawAllObjects()
    }
  },

  guid: function () {
    function S4() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  },

  moveHorizon: function(arg) {
    var target = this.data.selected
    if(target){
      target.realX += parseInt(arg.currentTarget.dataset.step) * 10
      this.data.patterns.forEach((value) => {
        if(value.type == this.data.SHAPE.ARROW && (value.start.uuid == target.uuid || value.end.uuid == target.uuid)){
          this.adjustArrow(value)
        }
      })
    }
    else{
      this.setData({
       boardX: this.data.boardX + this.data.zoom * arg.currentTarget.dataset.step,
      });
    }
    this.drawAllObjects()
  },

  moveVertical: function(arg) {
    var target = this.data.selected
    if(target){
      target.realY += parseInt(arg.currentTarget.dataset.step) * 10
      var arrows = this.data.patterns.filter((value) => {
        return value.type == this.data.SHAPE.ARROW && (value.start.uuid == target.uuid || value.end.uuid == target.uuid)
      })
      console.log(arrows)
      arrows.forEach(this.adjustArrow)
      // for(a in target.arrows){
      //   this.adjustArrow(target.arrows[a])
      // }
    }
    else{
      this.setData({
        boardY: this.data.boardY + this.data.zoom * arg.currentTarget.dataset.step,
      });
    }
    this.drawAllObjects()
  },
  
  createPattern: function(x, y, type) {
    this.data.patterns.push({
      uuid: this.guid(),
      realX: x,
      realY: y,
      height: 50,
      width: 80,
      type: type,
      text: ""
    })
  },

  createText: function(x, y, text) {
    this.data.patterns.push({
      uuid: this.guid(),
      realX: x,
      realY: y,
      size: 14,
      type: this.data.SHAPE.TEXT,
      text: text,
    })
  },

  createArrow: function({start, end, startDirection, endDirection}){
    var arrow = this.adjustArrow({
      uuid: this.guid(),
      start: start,
      startDirection: startDirection,
      end: end,
      endDirection: endDirection,
      type: this.data.SHAPE.ARROW,
      path: [],
    })
    //console.log(start)
    //console.log(end)
    // start.arrows.push({arrow, startDirection})
    // end.arrows.push({arrow, endDirection})
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

          //console.log("!startOut !endOut parellel")
        }
        else{
          arrow.path.push(trans(POS_COR.CENTEREND, POS_COR.CENTERSTART))
          //console.log("!startOut !endOut !parellel")

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

    return {horizon: horizon, vertical: vertical}

  },

  findObject: function(x, y){

    var findInPatterns = (value)=>{

      if(value.type == this.data.SHAPE.TEXT){
        const ctx = this.data.canvas.getContext("2d")
        var metrics =ctx.measureText(value.text);

        return x > value.realX - metrics.width / 2 && x < value.realX + metrics.width / 2 &&

        y > value.realY - value.size / 2 && y < value.realY + value.size / 2
      }
      if(value.type == this.data.SHAPE.ARROW){
        var between = (num, a, b) => {
          return (num >= a && num <= b) || (num <= a && num >= b)
        }
        var length, width
        var isHorizon = value.startDirection % 2
        var segment = {
          isHorizon,
        }
        switch (value.startDirection){
          case this.data.DIRECTION.UP:
          segment.pos = value.start.realX
          segment.start = value.start.realY - value.start.height / 2
          break
        case this.data.DIRECTION.DOWN:
          segment.pos = value.start.realX
          segment.start = value.start.realY + value.start.height / 2
          break
        case this.data.DIRECTION.LEFT:
          segment.start = value.start.realX - value.start.width / 2
          segment.pos = value.start.realY
          break
        case this.data.DIRECTION.RIGHT:
          segment.start = value.start.realX + value.start.width / 2
          segment.pos = value.start.realY
          break 
        }
        for (var i = 0; i < value.path.length; i++) {
          segment.end = segment.isHorizon? value.path[i].x : value.path[i].y
          if (!segment.isHorizon) {
            length = y
            width = x
          }
          else {
            length = x
            width = y
          }
          if(between(length, segment.start, segment.end) && between(width, segment.pos + 3, segment.pos - 3))
            return true
          segment = {
            isHorizon: !segment.isHorizon,
            start: segment.pos,
            pos: segment.end,
          }
        }
        switch(value.endDirection){
          case this.data.DIRECTION.UP:
            segment.end = value.end.realY - value.end.height / 2
            break
          case this.data.DIRECTION.DOWN:
            segment.end = value.end.realY + value.end.height / 2
            break
          case this.data.DIRECTION.LEFT:
            segment.end = value.end.realX - value.end.width / 2
            break
          case this.data.DIRECTION.RIGHT:
            segment.end = value.end.realX + value.end.width / 2
            break
        }
        if (!segment.isHorizon) {
          length = y
          width = x
        }
        else {
          length = x
          width = y
        }
        if(between(length, segment.start, segment.end) && between(width, segment.pos + 3, segment.pos - 3))
          return true
        return false
      }
      else{
        return this.isInPattern({x, y}, value)
      }
    }
    var index = this.data.patterns.findIndex(findInPatterns)
    // console.log(index)
    return index
  },

  selectObject: function(x, y){
    //console.log(this.data.patterns)
    var selectedIndex = this.findObject(x, y)
    // console.log(selectedIndex, x, y)
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
    //console.log(ctx)
    ctx.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height)
    ctx.save()
    ctx.translate(-this.data.boardX, -this.data.boardY)
    ctx.scale(this.data.boardScale, this.data.boardScale)
    this.data.patterns.forEach((value)=>{
      console.log(value)
      this.drawObject(value, ctx, value == this.data.selected)
    })
    ctx.restore()
  },

  drawObject: function(obj, ctx, selected=false){

    if(selected) {
      ctx.setLineDash([2,2])
    }
    else {
      ctx.setLineDash([])
    }

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
        if(selected){
          ctx.strokeRect(objX, obj.realY - obj.size / 2, ctx.measureText(obj.text).width, obj.size)
        }
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

  touchCoorToReal: function({x, y}){
    return {
      x: x / this.data.boardScale + this.data.boardX,
      y: y / this.data.boardScale + this.data.boardY,
    }
  },

  onTouchCanvas: function(event){

    var {x, y} = this.touchCoorToReal(event.touches[0])

    switch(this.data.paintMode){
      case this.data.SHAPE.SELECT:
        this.selectObject(x, y)
        break
      case this.data.SHAPE.SQUARE:
      case this.data.SHAPE.ELLIPSE:
      case this.data.SHAPE.PARALLELOGRAM:
      case this.data.SHAPE.DIAMOND:
        this.createPattern(x, y, this.data.paintMode)
        break
      case this.data.SHAPE.ARROW:
        var index = this.findObject(x, y)
        if(index != -1){
          this.arrow_drawing_cache.touch = event.touches[0].identifier
          this.arrow_drawing_cache.start = this.data.patterns[index]
          this.arrow_drawing_cache.lastX = event.touches[0].x
          this.arrow_drawing_cache.lastY = event.touches[0].y
        }

        break
      case this.data.SHAPE.TEXT:
        this.setData({
          x: x,
          y: y,
          texts: true,
        })
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
          var {x, y} = this.touchCoorToReal(touch)
          if(this.arrow_drawing_cache.startDirection == null){
            //var x = touch.x, y = touch.y
            if (!this.isInPattern({x, y}, this.arrow_drawing_cache.start) 
            && this.isInPattern(this.touchCoorToReal({x: this.arrow_drawing_cache.lastX, y: this.arrow_drawing_cache.lastY}), this.arrow_drawing_cache.start)){
              if (y > this.arrow_drawing_cache.start.realY + this.arrow_drawing_cache.start.height / 2){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.DOWN
              }
              else if (x > this.arrow_drawing_cache.start.realX + this.arrow_drawing_cache.start.width / 2){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.RIGHT
              }
              else if (y < this.arrow_drawing_cache.start.realY - this.arrow_drawing_cache.start.height / 2){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.UP
              }
              else if (x < this.arrow_drawing_cache.start.realX - this.arrow_drawing_cache.start.width / 2){
                this.arrow_drawing_cache.startDirection = this.data.DIRECTION.LEFT
              }
            }
            else {
              this.arrow_drawing_cache.lastX = touch.x
              this.arrow_drawing_cache.lastY = touch.y
            }
          }
        }
    }
  },

  onTouchEndCanvas: function(event) {
    // console.log(event)
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

          var {x, y} = this.touchCoorToReal(touch)
          var endIndex = this.findObject(x, y)
          if (endIndex < 0) return
          var end = this.data.patterns[endIndex]
          this.arrow_drawing_cache.end = end
          if(x >= end.realX + end.width / 4) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.RIGHT
          }
          else if (x <= end.realX - end.width / 4) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.LEFT

          }
          else if (y >= end.realY) {
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.DOWN

          }
          //else if (y > this.mapCor(end.realY, this.AXE.Y)) 
          else{
            this.arrow_drawing_cache.endDirection = this.data.DIRECTION.UP
          }
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

  isInPattern: function({x, y}, pattern) {
    // comparation between real coodinate
    return x > pattern.realX - pattern.width / 2
      && x < pattern.realX + pattern.width / 2
      && y > pattern.realY - pattern.height / 2
      && y < pattern.realY + pattern.height / 2
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

  editText: function(){
    if(this.data.selected){
      this.setData({texts: true, text:this.data.selected.text})
      if (this.data.selected.type == this.data.SHAPE.ARROW) return 
      this.data.selected.text = this.data.text
    }
  },

  test: function(){
    this.createPattern(20, 20, this.data.SHAPE.SQUARE)
    this.createPattern(100, 100, this.data.SHAPE.SQUARE)
    this.createText(20, 100, "abc")

      
    this.createPattern(50, 140, this.data.SHAPE.SQUARE)
    this.createPattern(200, 250, this.data.SHAPE.SQUARE)
    this.drawAllObjects()
  }
})

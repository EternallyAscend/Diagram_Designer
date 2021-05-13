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
      FONT: 6,
    },
    patterns: [],
    paintMode: 0, // SHAPE->SELECT
    boardScale: 1,
    boardX: 0,
    boardY: 0,
    selected: null,
    canvas: null,
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
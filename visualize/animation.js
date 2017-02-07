var AnimationWrapper = function(anim) {
  this.anim = anim;
  this.s = anim.s;
  this.button = this.s.append('div');
  this.has_run = false;

  this.layout = function() {
    this.s.style('position', 'relative');
    var W = parseInt(this.s.style('width'));
    var H = parseInt(this.s.style('height'));
    this.button
      .style("border", "1px black solid")
      .style('width', 60)
      .style('height', 25 )
      .style('position', 'absolute')
      .style('left', W/40)
      .style('bottom', H/60)
      .style('border-radius', 6)
      .style("cursor", "default")
      .style("text-align", "center")
      .style("vertical-align", "middle")
      .style("background", "#DDDDDD")
      .style("z-index", 10)
      .text('play');
    var this_ = this;
    this.button.on("click", function() {this_.on_click(); });
  };

  this.run = function() {};
  this.reset = function() { this.W.postMessage({cmd: "reset"}); };

  this.hide = function() {
    this.button.style('visibility', 'hidden');
  }
  this.unhide = function() {
    this.button.style('visibility', 'visible');
  }

  this.on_click = function () {
    if (this.has_run) {
      this.reset();
      this.has_run = false;
    }
    this.hide();
    this.run();
  }
  this.on_done = function () {
    this.has_run = true;
    this.unhide();
  }

  this.bindToWorker = function(W) {
    this.W = W;
    var this_ = this;
    var obj = this.anim;
    W.onmessage = function(e) {
      data = e.data;
      switch (data.msg) {
        case "update":
          obj.sne = data.embed;
          window.requestAnimationFrame(function() { obj.rerender();});
          break;
        case "ready":
          break;
        case "edges":
          obj.edges = data.edges;
          obj.make_edges();
          window.requestAnimationFrame(function() { obj.rerender();});
        case "done":
          this_.on_done();
          break;
      }
    };
  };
}


 setTimeout(function(){
    var test = new BasicVis.GraphPlot3("#tsne_mnist_3D", 400);
    test.controls.reset();
    test.layout();
    test._animate();
    test.point_classes = mnist_ys;

    var test_wrap = new AnimationWrapper(test);
    test_wrap.button.on("mousemove", function() { mnist_tooltip.hide(); d3.event.stopPropagation();});

    var tooltip = null;
    setTimeout(function() {
      test_wrap.layout();
      test.point_event_funcs["mouseover"] = function(i) {
        mnist_tooltip.display(i);
        mnist_tooltip.unhide();
      };
      test.point_event_funcs["mouseout"] = function(i) {
        mnist_tooltip.hide();
      };
      mnist_tooltip.bind_move(test.s);
      
    }, 50);

    var W = new Worker("js/CostLayout-worker-3D.js");
    W.onmessage = function(e) {
      data = e.data;
      switch (data.msg) {
        case "edges":
          test.make_points(1000);
          test.make_edges(data.edges);
          break;
        case "update":
          test.position(data.embed);
          break;
        case "done":
          test_wrap.on_done();
          break;
      }
    };

    W.postMessage({cmd: "init", xs: mnist_xs, N: 1000, D: 784, cost: "tSNE"});

    test_wrap.run   = function(){ W.postMessage({cmd: "run", steps: 500, skip: 1,  Kstep: 10.0, Kmu: 0.85})};
    test_wrap.reset = function(){ W.postMessage({cmd: "reset"})};

  }, 500);

function vis_layers(canvas, net) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var L = net.layers;
    var dx = (W - 50)/L.length;
    var x = 10;
    var y = 40;
    ctx.font="12px Verdana";
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillText("Value Function Approximating Neural Network:", 10, 14);
    for(let k=0;k<L.length;k++) {
        if(typeof(L[k].out_act)==='undefined') continue; // maybe not yet ready
        var kw = L[k].out_act.w;
        var n = kw.length;
        var dy = (H-50)/n;
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillText(L[k].layer_type + "(" + n + ")", x, 35);
        for(var q=0;q<n;q++) {
            var v = Math.floor(kw[q]*100);
            if(v >= 0) ctx.fillStyle = "rgb(0,0," + v + ")";
            if(v < 0) ctx.fillStyle = "rgb(" + (-v) + ",0,0)";
            ctx.fillRect(x,y,10,10);
            y += 12;
            if(y>H-25) { y = 40; x += 12};
        }
        x += 50;
        y = 40;
    }
} 

export { vis_layers };

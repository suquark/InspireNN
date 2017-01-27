import { vis_layers } from './visualize/layers.js';

var reward_graph = new cnnvis.Graph();

function draw() {
    // Draw everything
    if(!skipdraw || w.clock % 50 === 0) {
        // draw world
        w.draw(canvas);
        var b = w.agents[0].brain;
        // draw brain info
        b.visSelf(document.getElementById('brain_info_div'));
        // draw input
        let canvas = document.getElementById("vis_canvas");
        vis_net_input(canvas, b.last_input_array);
        // draw reward
        if (w.clock % 200 === 0) {
            reward_graph.add(w.clock / 200, b.average_reward_window.get_average());
            let gcanvas = document.getElementById("graph_canvas");
            reward_graph.drawSelf(gcanvas);
        }
        // draw net
        if(simspeed <= 1 || w.clock % 50 == 0) {
            let canvas = document.getElementById("net_canvas");
            vis_layers(canvas, b.value_net);
        }
    }
}


// Tick the world
function tick() {
    w.tick();
    draw();
}

var simspeed = 2;
function goveryfast() {
    window.clearInterval(current_interval_id);
    current_interval_id = setInterval(tick, 0);
    skipdraw = true;
    simspeed = 3;
}
function gofast() {
    window.clearInterval(current_interval_id);
    current_interval_id = setInterval(tick, 0);
    skipdraw = false;
    simspeed = 2;
}
function gonormal() {
    window.clearInterval(current_interval_id);
    current_interval_id = setInterval(tick, 30);
    skipdraw = false;
    simspeed = 1;
}
function goslow() {
    window.clearInterval(current_interval_id);
    current_interval_id = setInterval(tick, 200);
    skipdraw = false;
    simspeed = 0;
}

function savenet() {
    var j = w.agent.brain.value_net.toJSON();
    var t = JSON.stringify(j);
    document.getElementById('tt').value = t;
}

function loadnet() {
    var t = document.getElementById('tt').value;
    var j = JSON.parse(t);
    w.agent.brain.value_net.fromJSON(j);
    stoplearn(); // also stop learning
    gonormal();
}

function startlearn() {
    w.agent.brain.learning = true;
}
function stoplearn() {
    w.agent.brain.learning = false;
}

function reload() {
    w.agent = new Agent(); // this should simply work. I think... ;\
    reward_graph = new cnnvis.Graph(); // reinit
}

var w; // global world object
var current_interval_id;
var skipdraw = false;
var canvas;

function start() {
    canvas = document.getElementById("canvas");
    
    w = create_world(canvas.width, canvas.height);
    
    gofast();
}
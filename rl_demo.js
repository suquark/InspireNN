import { Vol, Net, Trainer, DQN, World, Agent } from 'convnet.js';

// Load JSON text from server hosted file and return JSON parsed object
function loadJSON(filePath) {
  // Load json file;
  var json = loadTextFileAjaxSync(filePath, "application/json");
  // Parse json
  return JSON.parse(json);
}   

// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath, mimeType)
{
  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("GET",filePath,false);
  if (mimeType != null) {
    if (xmlhttp.overrideMimeType) {
      xmlhttp.overrideMimeType(mimeType);
    }
  }
  xmlhttp.send();
  if (xmlhttp.status==200)
  {
    return xmlhttp.responseText;
  }
  else {
    // TODO Throw exception
    return null;
  }
}

function create_world(H, W) {
    var num_inputs = 27; // 9 eyes, each sees 3 numbers (wall, green, red thing proximity)
    var num_actions = 5; // 5 possible angles agent can turn
    var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
    var network_size = num_inputs * temporal_window + num_actions * temporal_window + num_inputs;

    // the value function network computes a value of taking any of the possible actions
    // given an input state. Here we specify one explicitly the hard way
    // but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
    // to just insert simple relu hidden layers.
    var layer_defs = [];
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
    layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
    layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
    layer_defs.push({type:'regression', num_neurons:num_actions});
    var net = new Net();
    net.makeLayers(layer_defs);

    net.fromJSON(loadJSON("RL/helper/saving.json"));

    // $.getJSON("RL/helper/saving.json", function(json) {
    //     net.fromJSON(json);
    //     stoplearn();
    //     goveryfast();
    // }); 

    // options for the Temporal Difference learner that trains the above net
    // by backpropping the temporal difference learning rule.


    var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.05};

    // var tdtrainer_options = { batch_size:64, l2_decay:0.01, method: 'adam' };


    var tdtrainer = new Trainer(net, tdtrainer_options);

    var dqn_options = {
        temporal_window: temporal_window,
        experience_size: 30000,
        start_learn_threshold: 1000,
        gamma : 0.7,
        learning_steps_total: 200000,
        learning_steps_burnin: 3000,
        epsilon_min: 0.05,
        epsilon_test_time: 0.05
    };
    var brain = new DQN(num_inputs, num_actions, tdtrainer, dqn_options); // woohoo

    var agent = new Agent(brain);    
    var world = new World(H, W, agent);
    return world;
}

export { create_world };

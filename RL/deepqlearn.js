import {
    getopt,
    randi,
    randf,
    sample_from_dist,
    sample,
    random_replace,
    one_hot,
    AvgWindow
} from 'util.js';

import { Vol } from 'vol.js';

import { migrate } from 'conf.js';

import { Net } from 'topology/vallia.js';

class Experience {
    // Experience nodes store all this information, which is used in the
    // Q-learning update step
    constructor (state0, action0, reward0, state1) {
        this.state0 = state0;    // An agent is in state0
        this.action0 = action0;  // and does action0
        this.reward0 = reward0;  // environment then assigns reward0
        this.state1 = state1;    // and provides new state, state1
    }
}

class DQN {
    // A DQN Brain object does all the magic.
    // over time it receives some inputs and some rewards
    // and its job is to set the outputs to maximize the expected reward

    constructor(num_states, num_actions, tdtrainer, opt) {
        let m = new migrate(this, opt);
        // in number of time steps, of temporal memory
        // the ACTUAL input to the net will be (x,a) temporal_window times, and followed by current x
        // so to have no information from previous time step going into value function, set to 0.
        m.move('temporal_window', 1);
        // size of experience replay memory
        m.move('experience_size', 30000);
        // number of examples in experience replay memory before we begin learning
        m.move('start_learn_threshold', Math.floor(Math.min(this.experience_size * 0.1, 1000)));
        // gamma is a crucial parameter that controls how much plan-ahead the agent does. In [0,1]
        m.move('gamma', 0.8);
        // number of steps we will learn for
        m.move('learning_steps_total', 100000);
        // how many steps of the above to perform only random actions (in the beginning)?
        m.move('learning_steps_burnin', 3000);
        // what epsilon value do we bottom out on? 0.0 => purely deterministic policy at end
        m.move('epsilon_min', 0.05);
        // what epsilon to use at test time? (i.e. when learning is disabled)
        m.move('epsilon_test_time', 0.01);
        // advanced feature. Sometimes a random action should be biased towards some values
        // for example in flappy bird, we may want to choose to not flap more often
        m.move('random_action_distribution', []);

        // this better sum to 1 by the way, and be of length this.num_actions
        if (this.random_action_distribution.length > 0) {
            if (this.random_action_distribution.length !== num_actions) {
                console.log('TROUBLE. random_action_distribution should be same length as num_actions.');
            }
            dist_checker(this.random_action_distribution);
        }
         
    
        // states that go into neural net to predict optimal action look as
        // x0,a0,x1,a1,x2,a2,...xt
        // this variable controls the size of that temporal window. Actions are
        // encoded as 1-of-k hot vectors
        this.net_inputs = num_states * this.temporal_window + num_actions * this.temporal_window + num_states;
        this.num_states = num_states;
        this.num_actions = num_actions;
        this.window_size = Math.max(this.temporal_window, 2); // must be at least 2, but if we want more context even more
        this.state_window = new Array(this.window_size);
        this.action_window = new Array(this.window_size);
        this.reward_window = new Array(this.window_size);
        this.net_window = new Array(this.window_size);

        this.tdtrainer = tdtrainer;
        // create [state -> value of all possible actions] modeling net for the value function
        this.value_net = this.tdtrainer.net;
        this.net_checker(this.value_net);

        // // and finally we need a Temporal Difference Learning trainer!
        // let tdtrainer_options = {
        //     learning_rate: 0.01,
        //     momentum: 0.0,
        //     batch_size: 64,
        //     l2_decay: 0.01
        // };
        //this.tdtrainer = new Trainer(this.value_net, tdtrainer_options);

        // experience replay
        this.experience = [];

        // various housekeeping variables
        this.age = 0; // incremented every backward()
        this.forward_passes = 0; // incremented every forward()
        // this.epsilon = 1.0; // controls exploration exploitation tradeoff. Should be annealed over time
        this.latest_reward = 0;
        this.last_input_array = [];
        this.average_reward_window = new AvgWindow(1000, 10);
        this.average_loss_window = new AvgWindow(1000, 10);
        this.learning = true;
    }

    random_action() {
        // a bit of a helper function. It returns a random action
        // we are abstracting this away because in future we may want to 
        // do more sophisticated things. For example some actions could be more
        // or less likely at "rest"/default state.
        if (this.random_action_distribution.length === 0) {
            return randi(0, this.num_actions);
        } else {
            // okay, lets do some fancier sampling:
            return sample_from_dist(this.random_action_distribution);
        }
    }

    policy(s) {
        // compute the value of doing any action in this state
        // and return the argmax action and its value
        let action_values = this.value_net.forward(new Vol(s));
        let maxk = action_values.max_index();
        return { action: maxk, value: action_values.w[maxk] };
    }

    _toarray(arr) {
        let a = [];
        for (let i in arr) {
            a.push(arr[i]);
        }
        return a;
    }

    getNetInput(xt) {
        // return s = (x, a, x, a, x, a, xt) state vector. 
        // It's a concatenation of last window_size (x,a) pairs and current state x
        var w = [];
        w = w.concat(xt); // start with current state
        // and now go backwards and append states and actions from history temporal_window times
        var n = this.window_size;
        for (let k = 0; k < this.temporal_window; k++) {
            let state = this.state_window[n - 1 - k];
            let action = this.action_window[n - 1 - k];
            // state
            w = w.concat(state);
            // action, encoded as 1-of-k indicator vector. We scale it up a bit because
            // we dont want weight regularization to undervalue this information, as it only exists once
            let action1ofk = one_hot(this.num_actions, action, 1.0 * this.num_states);

            w = w.concat(this._toarray(action1ofk)); // do not concat array & floatarray
        }
        return w;
    }

    get epsilon() {
        if (this.learning) {
            // compute epsilon for the epsilon-greedy policy
            return Math.min(1.0, Math.max(this.epsilon_min, 1.0 - (this.age - this.learning_steps_burnin) / (this.learning_steps_total - this.learning_steps_burnin)));
        } else {
            return this.epsilon_test_time; // use test-time value
        }
    }

    get explore() {
        // explore or decision
        return randf(0, 1) < this.epsilon;
    }

    forward(input_array) {
        // compute forward (behavior) pass given the input neuron signals from body
        this.forward_passes += 1;
        this.last_input_array = input_array; // back this up

        // create network input
        var action;
        if (this.forward_passes > this.temporal_window) {
            // we have enough to actually do something reasonable
            var net_input = this.getNetInput(input_array);
            action = this.explore ? this.random_action() : this.policy(net_input).action;
        } else {
            // pathological case that happens first few iterations 
            // before we accumulate window_size inputs
            var net_input = [];
            action = this.random_action();
        }

        // remember the state and action we took for backward pass
        this.net_window.shift(); this.net_window.push(net_input);
        this.state_window.shift(); this.state_window.push(input_array);
        this.action_window.shift(); this.action_window.push(action);

        return action;
    }

    backward(reward) {
        this.latest_reward = reward;
        this.average_reward_window.add(reward);
        this.reward_window.shift();
        this.reward_window.push(reward);

        if (!this.learning) return;  // without updating
        
        // various book-keeping
        this.age += 1;

        // it is time t+1 and we have to store (s_t, a_t, r_t, s_{t+1}) as new experience
        // (given that an appropriate number of state measurements already exist, of course)
        if (this.forward_passes > this.temporal_window + 1) {
            var e = new Experience();
            var n = this.window_size;
            // latest experience
            e.state0 = this.net_window[n - 2];
            e.state1 = this.net_window[n - 1];
            e.action0 = this.action_window[n - 2];
            e.reward0 = this.reward_window[n - 2];
            if (this.experience.length < this.experience_size) {
                this.experience.push(e);
            } else {
                // replace. finite memory!
                random_replace(this.experience, e);
            }
        }

        // learn based on experience, once we have some samples to go on
        // this is where the magic happens...
        if (this.experience.length > this.start_learn_threshold) {
            let avcost = 0.0;
            for (let k = 0; k < this.tdtrainer.batch_size; k++) {
                let e = sample(this.experience);
                var maxact = this.policy(e.state1);
                var r = e.reward0 + this.gamma * maxact.value;
                // y for Regression loss of compare value[dim]
                let x = new Vol(e.state0);
                let y = { dim: e.action0, val: r };
                let loss = this.tdtrainer.train(x, y);
                avcost += loss.loss;
            }
            avcost /= this.tdtrainer.batch_size;
            this.average_loss_window.add(avcost);
        }
    }

    net_checker(net) {
        // this is an advanced usage feature, because size of the input to the network, and number of
        // actions must check out. This is not very pretty Object Oriented programming but I can't see
        // a way out of it :(
        let layer_defs = net.layers;
        if (layer_defs.length < 2) {
            console.warn('TROUBLE! must have at least 2 layers');
        }
        if (layer_defs[0].layer_type !== 'input') {
            console.warn('TROUBLE! first layer must be input layer!');
        }
        if (layer_defs[layer_defs.length - 1].layer_type !== 'regression') {
            console.warn('TROUBLE! last layer must be input regression!');
        }
        if (layer_defs[0].out_depth * layer_defs[0].out_sx * layer_defs[0].out_sy !== this.net_inputs) {
            console.warn('TROUBLE! Number of inputs must be num_states * temporal_window + num_actions * temporal_window + num_states!');
        }
        if (layer_defs[layer_defs.length - 1].out_size !== this.num_actions) {
            console.warn('TROUBLE! Number of regression neurons should be num_actions!');
        }
    }
}

function visState(brain, node) {
    elt.innerHTML = ''; // erase elt first

    // elt is a DOM element that this function fills with brain-related information
    var brainvis = document.createElement('div');

    // basic information
    var desc = document.createElement('div');
    var t = '';
    t += 'experience replay size: ' + brain.experience.length + '<br>';
    t += 'exploration epsilon: ' + brain.epsilon + '<br>';
    t += 'age: ' + brain.age + '<br>';
    t += 'average Q-learning loss: ' + brain.average_loss_window.get_average() + '<br />';
    t += 'smooth-ish reward: ' + brain.average_reward_window.get_average() + '<br />';
    desc.innerHTML = t;
    brainvis.appendChild(desc);
    elt.appendChild(brainvis);
}



function dist_checker(a) {
    var s = 0.0;
    for (var k = 0; k < a.length; k++) {
        s += a[k];
    }
    if (Math.abs(s - 1.0) > 0.0001) {
        console.warn('TROUBLE. random_action_distribution should sum to 1!');
    }
}

function get_simple_net(net_inputs, num_actions, hidden_layer_sizes) {
    // create a very simple neural net by default
    let layer_defs = [];
    layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: net_inputs});
    hidden_layer_sizes.forEach(function (n) {
        layer_defs.push({type: 'fc', num_neurons: n, activation: 'relu'}); // relu by default
    });
    layer_defs.push({type: 'regression', num_neurons: num_actions}); // value function output
    let value_net = new Net();
    value_net.makeLayers(layer_defs);
    return value_net;
}

export { DQN, visState, get_simple_net };

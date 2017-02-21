import { Vol } from 'vol.js';
import { assert } from 'util/assert.js';
import { get_layer } from 'layers/index.js';

// Net manages a set of layers
// For now constraints: Simple linear order of layers, first layer input last layer a cost layer

class Sequential {
    constructor(options) {
        this.layers = [];
        this.layer_map = {};
    }

    // takes a list of layer definitions and creates the network layer objects
    makeLayers(defs) {
        // few checks
        assert(defs.length >= 1, 'Error! At least one layer is required.');
        assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');

        for (let i in defs) {
            if (typeof defs[i] === "string") defs[i] = { type: defs[i] };
        }
       
        // relus like a bit of positive bias to get gradients early
        // otherwise it's technically possible that a relu unit will never turn on (by chance)
        // and will never get any gradient and never contribute any computation. Dead relu.
        for (let i in defs) {
            if (defs[i].type === 'relu' && typeof(defs[i - 1].bias_pref) === 'undefined') {
                // ReLU cannot be first layer. So we assume i > 0
                defs[i - 1].bias_pref = 0.1;
            }
        }
       
        // create the layers
        this.layers = [];
        for (let i = 0; i < defs.length; i++) {
            let def = defs[i];
            if (i > 0) {
                let prev = this.layers[i - 1];
                def.in_sx = prev.out_sx;
                def.in_sy = prev.out_sy;
                def.in_depth = prev.out_depth;
            }
            this.layers.push(get_layer(def));
        }

        // naming
        for (let i in this.layers) {
            let l = this.layers[i];
            if (l.name) this.layer_map[l.name] = l;
        }
    }

    // forward prop the network. 
    // The trainer class passes is_training = true, but when this function is
    // called from outside (not from the trainer), it defaults to prediction mode
    forward(V, is_training=false) {
        return this.layers.reduce((input, layer) => layer.forward(input, is_training), V);
    }
    
    // backprop: compute gradients wrt all parameters
    backward() {
        // reduceRight
        var N = this.layers.length;
        for (var i = N - 1; i >= 0; i--) {  // first layer assumed input
            this.layers[i].backward();
        }
    }

    get trainables() {
        // accumulate parameters and gradients for the entire network to train
        return this.layers.reduce((acc, cur) => acc.concat(cur.trainables), []);
    }

    // this is a convenience function for returning the argmax
    // return index of the class with highest class probability
    prediction(x) {
        if (typeof x !== 'undefined') this.forward(x);
        // assume output is a vector
        return this.output.max_index;
    }

    compile(options) { this.layers.forEach(function(l) { l.compile(options); }); }

    toJSON() { return {'layers': this.layers.map(x => x.toJSON())}; }

    fromJSON(json) {
        for (let i in this.layers) {
            this.layers[i].fromJSON(json.layers[i])
        }
    }

    get output() {
        return this.outputLayer.out_act;
    }

    get outputLayer() { return this.layers[this.layers.length - 1]; }
}

  
export { Sequential };

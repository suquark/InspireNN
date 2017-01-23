import { Vol } from 'vol';
import { assert, indexOfMax } from 'util';
import { get_layer } from 'layers/layer_export'

// Net manages a set of layers
// For now constraints: Simple linear order of layers, first layer input last layer a cost layer

class Net {
    constructor(options) {
        this.layers = [];
    }
      // takes a list of layer definitions and creates the network layer objects
    makeLayers(defs) {
        // few checks
        assert(defs.length >= 2, 'Error! At least one input layer and one loss layer are required.');
        assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');

        // desugar layer_defs for adding activation, dropout layers etc
      
        var new_defs = [];
        defs.forEach(function(def) {
            if (def.type==='softmax' || def.type==='svm') {
                // add an fc layer here, there is no reason the user should
                // have to worry about this and we almost always want to
                new_defs.push({type:'fc', num_neurons: def.num_classes});
            }

            if (def.type==='regression') {
                // add an fc layer here, there is no reason the user should
                // have to worry about this and we almost always want to
                new_defs.push({type:'fc', num_neurons: def.num_neurons});
            }

            if((def.type==='fc' || def.type==='conv') && typeof(def.bias_pref) === 'undefined') {
                def.bias_pref = 0.0;
                if(typeof def.activation !== 'undefined' && def.activation === 'relu') {
                    def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
                    // otherwise it's technically possible that a relu unit will never turn on (by chance)
                    // and will never get any gradient and never contribute any computation. Dead relu.
                }
            }
            new_defs.push(def);
            if (typeof def.activation !== 'undefined') {
                if (def.activation==='relu') { new_defs.push({type:'relu'}); }
                else if (def.activation==='sigmoid') { new_defs.push({type:'sigmoid'}); }
                else if (def.activation==='tanh') { new_defs.push({type:'tanh'}); }
                else if (def.activation==='maxout') {
                    // create maxout activation, and pass along group size, if provided
                    new_defs.push({type:'maxout', group_size: def.group_size || 2});
                }
                else { console.log('ERROR unsupported activation ' + def.activation); }
            }
            if (typeof def.drop_prob !== 'undefined' && def.type !== 'dropout') {
                new_defs.push({type:'dropout', drop_prob: def.drop_prob});
            }
        });

        defs = new_defs;

        // create the layers
        this.layers = [];
        for(var i = 0; i < defs.length; i++) {
            let def = defs[i];
            if (i > 0) {
                let prev = this.layers[i - 1];
                def.in_sx = prev.out_sx;
                def.in_sy = prev.out_sy;
                def.in_depth = prev.out_depth;
            }
            this.layers.push(get_layer(def));
        }
    }

    // forward prop the network. 
    // The trainer class passes is_training = true, but when this function is
    // called from outside (not from the trainer), it defaults to prediction mode
    forward(V, is_training=false) {
        return this.layers.reduce((input, layer) => layer.forward(input, is_training), V);
    } 
        // let act = this.layers[0].forward(V, is_training);
        // for(let i = 1; i < this.layers.length; i++) {
        //     act = this.layers[i].forward(act, is_training);
        // }
        // return act;
 

    getCostLoss(V, y) {
        this.forward(V, false);
        let loss = outputLayer().backward(y);
        return loss;
    }
    
    // backprop: compute gradients wrt all parameters
    backward(y) {
        // reduceRight
        var N = this.layers.length;
        var loss = this.layers[N-1].backward(y); // last layer assumed to be loss layer
        for(var i = N - 2; i >= 0; i--) {        // first layer assumed input
            this.layers[i].backward();
        }
        return loss;
    }

    getParamsAndGrads() {
        // accumulate parameters and gradients for the entire network
        return this.layers.reduce((acc, cur) => acc.concat(cur.getParamsAndGrads()), []);
        // var response = [];
        // this.layers.forEach(function(l) {
        //     Array.prototype.push.apply(response, this.layers[i].getParamsAndGrads());  // concat them
        // });
        // return response;
    }

    getPrediction() {
        // this is a convenience function for returning the argmax
        // prediction, assuming the last layer of the net is a softmax
        let S = outputLayer();
        assert(S.layer_type === 'softmax', 'getPrediction function assumes softmax as last layer of the net!');
        // return index of the class with highest class probability
        let p = S.out_act.w;
        return indexOfMax(p);
    }

    compile(options) { this.layers.forEach(function(l) { l.compile(options); }); }

    toJSON() { return {'layers': this.layers.map(x => x.toJSON())}; }

    fromJSON(json) {
        // NOTE: .fromJSON(Lj) returns undefined, so we take the risk of using JSON as opts
        this.layers = json.layers.map(Lj => get_layer(Lj));
    }
  
    outputLayer() { return this.layers[this.layers.length - 1]; }

}

  
export { Net };

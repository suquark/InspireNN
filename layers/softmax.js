import { OutputLayer } from 'layers/layer.js';
// Layers that implement a loss. Currently these are the layers that 
// can initiate a backward() pass. In future we probably want a more 
// flexible system that can accomodate multiple losses to do multi-task
// learning, and stuff like that. But for now, one of the layers in this
// file must be the final layer in a Net.


class SoftmaxLayer extends OutputLayer {
    // This is a classifier, with N discrete classes from 0 to N-1
    // it gets a stream of N incoming numbers and computes the softmax
    // function (exponentiate and normalize to sum to 1 as probabilities should)
    constructor(opt) { super('softmax', opt); }

    forward(V, is_training) {
        this.in_act = V;

        let A = new Vol(1, 1, this.out_depth, 0.0);
        let as = V.w;
        // compute max activation
        let amax = V.max(this.out_depth);

        // compute exponentials (carefully to not blow up)
        var es = zeros(this.out_depth);
        var esum = 0.0;
        for (var i = 0; i < this.out_depth; i++) {
            var e = Math.exp(as[i] - amax);
            esum += e;
            es[i] = e;
        }

        // normalize and output to sum to one
        for (let i = 0; i < this.out_depth; i++) {
            es[i] /= esum;
        }
        
        this.es = es; // save these for backprop

        A.w = es.slice(); 
        this.out_act = A;
        return this.out_act;
    }

    backward(y) {
        // compute and accumulate gradient wrt weights and bias of this layer
        let x = this.in_act;
        x.dw.fill(0.);  // zero out the gradient of input Vol

        for (let i = 0; i < this.out_depth; i++) {
            let indicator = i === y ? 1.0 : 0.0;
            let mul = -(indicator - this.es[i]);
            x.dw[i] = mul;
        }

        // loss is the class negative log likelihood
        return -Math.log(this.es[y]);
    }
}
  


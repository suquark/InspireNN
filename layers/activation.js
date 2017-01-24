import { indexOfMax } from 'util.js';
import { Layer } from 'layers/layer.js'

class ReluLayer extends Layer {
    // Implements ReLU nonlinearity elementwise
    // x -> max(0, x)
    // the output is in [0, inf)
    constructor(opt) { super('relu', opt); }

    forward(V, is_training) {
        this.in_act = V;
        var V2 = V.clone();
        var N = V.w.length;
        var V2w = V2.w;
        for (let i = 0; i < N; i++) { 
            if (V2w[i] < 0) V2w[i] = 0; // threshold at 0
        }
        this.out_act = V2;
        return this.out_act;
    }
    backward() {
        var V = this.in_act; // we need to set dw of this
        var V2 = this.out_act;
        var N = V.length;
        V.dw.fill(0.); // zero out gradient wrt data
        for (var i = 0; i < N; i++) {
            V.dw[i] = V2.w[i] <= 0 ? 0 : V2.dw[i]; // threshold
        }
    }
}
  
class SigmoidLayer extends Layer {

    // Implements Sigmoid nnonlinearity elementwise
    // x -> 1/(1+e^(-x))
    // so the output is between 0 and 1.

    constructor(opt) { super('sigmoid', opt); }

    forward(V, is_training) {
        this.in_act = V;
        var V2 = V.cloneAndZero();
        var N = V.length;
        var V2w = V2.w;
        var Vw = V.w;
        for (let i = 0; i < N; i++) { 
            V2w[i] = 1.0 / (1.0 + Math.exp(-Vw[i]));
        }
        this.out_act = V2;
        return this.out_act;
    }

    backward() {
        var V = this.in_act; // we need to set dw of this
        var V2 = this.out_act;
        var N = V.length;
        V.dw.fill(0.); // zero out gradient wrt data
        for (let i = 0; i < N; i++) {
            let v2wi = V2.w[i];
            V.dw[i] =  v2wi * (1.0 - v2wi) * V2.dw[i];
        }
    }
}

class TanhLayer extends Layer {

    // Implements Tanh nnonlinearity elementwise
    // x -> tanh(x) 
    // so the output is between -1 and 1.

    constructor(opt) { super('tanh', opt); }

    forward(V, is_training) {
        this.in_act = V;
        var V2 = V.cloneAndZero();
        var N = V.length;
        for(let i = 0; i < N; i++) { 
            V2.w[i] = tanh(V.w[i]);
        }
        this.out_act = V2;
        return this.out_act;
    }

    backward() {
        var V = this.in_act; // we need to set dw of this
        var V2 = this.out_act;
        var N = V.length;
        V.dw.fill(0.); // zero out gradient wrt data
        for (let i = 0; i < N; i++) {
            let v2wi = V2.w[i];
            V.dw[i] = (1.0 - v2wi * v2wi) * V2.dw[i];
        }
    }
}

 
class MaxoutLayer extends Layer {
    
    // Implements Maxout nnonlinearity that computes
    // x -> max(x)
    // where x is a vector of size group_size. Ideally of course,
    // the input size should be exactly divisible by group_size

    constructor(opt) {
        opt.serialize = ['group_size'];
        super('maxout', opt);
        // required and != 0
        this.group_size = opt.group_size || 2;
        this.out_depth = Math.floor(opt.in_depth / this.group_size);
        this.switches = zeros(this.out_sx*this.out_sy*this.out_depth); // useful for backprop
    }

    forward(V, is_training) {
        this.in_act = V;
        var N = this.out_depth; 
        var V2 = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);

        // optimization branch. If we're operating on 1D arrays we dont have
        // to worry about keeping track of x,y,d coordinates inside
        // input volumes. In convnets we do :(
        if (this.out_sx === 1 && this.out_sy === 1) {
            for(var i = 0; i < N; i++) {
                var ix = i * this.group_size; // base index offset
                var a = V.w[ix];
                var ai = 0;
                for(var j = 1; j < this.group_size; j++) {
                    var a2 = V.w[ix+j];
                    if(a2 > a) {
                        a = a2;
                        ai = j;
                    }
                }
                V2.w[i] = a;
                this.switches[i] = ix + ai;
            }
        } else {
            var n=0; // counter for switches
            for(var x=0;x<V.sx;x++) {
                for(var y=0;y<V.sy;y++) {
                    for (var i = 0; i < N; i++) {
                        var ix = i * this.group_size;
                        var a = V.get(x, y, ix);
                        var ai = 0;
                        for(var j = 1; j < this.group_size;j++) {
                            var a2 = V.get(x, y, ix + j);
                            if(a2 > a) {
                                a = a2;
                                ai = j;
                            }
                        }
                        V2.set(x,y,i,a);
                        this.switches[n] = ix + ai;
                        n++;
                    }
                }
            }
        }
        this.out_act = V2;
        return this.out_act;
    }

    backward() {
        var V = this.in_act; // we need to set dw of this
        var V2 = this.out_act;
        var N = this.out_depth;
        V.dw.fill(0.); // zero out gradient wrt data

        // pass the gradient through the appropriate switch
        if(this.out_sx === 1 && this.out_sy === 1) {
            for(var i = 0; i < N; i++) {
                var chain_grad = V2.dw[i];
                V.dw[this.switches[i]] = chain_grad;
            }
        } else {
            // bleh okay, lets do this the hard way
            var n = 0; // counter for switches
            for(var x = 0; x < V2.sx; x++) {
                for(var y = 0; y < V2.sy; y++) {
                    for(var i = 0; i < N; i++) {
                        var chain_grad = V2.get_grad(x,y,i);
                        V.set_grad(x, y, this.switches[n], chain_grad);
                        n++;
                    }
                }
            }
        }
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.switches = zeros(this.group_size);
    }
}


  

export { TanhLayer, MaxoutLayer, ReluLayer, SigmoidLayer };


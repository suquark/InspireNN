import { indexOfMax } from 'util.js';
import { Layer } from 'layers/layer.js'


class ActivationLayer extends Layer {
    constructor(name, f, fb, opt) { 
        super(name, opt); 
        this.f = f;
        this.fb = fb;
    }

    forward(V, is_training) {
        this.in_act = V;
        this.out_act = V.cloneAndZero();
        return this.f(this.out_act, this.in_act);
    }

    backward() {
        this.fb(this.in_act, this.out_act);
    }
}


/** Implements ReLU nonlinearity elementwise
 * x -> max(0, x)
 * the output is in [0, inf)
 */
class ReLULayer extends ActivationLayer {
    constructor(opt) { 
        super('relu', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) { 
                let x = xw[i];
                yw[i] = x < 0.0 ? 0.0 : x;
            }
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) xdw[i] = yw[i] <= 0.0 ? 0.0 : ydw[i]; // threshold
        }, opt);
    }
}

/** Implements Leaky ReLU nonlinearity elementwise
 * f(x) = alpha * x for x < 0, f(x) = x for x >= 0
 * the output is in (-Inf, inf)
 */
class LeakyReLULayer extends PActivationLayer {
    constructor(opt, leaky=0.2) { 
        super('lrelu', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) { 
                let x = xw[i];
                yw[i] = x < 0.0 ? leaky * x : x;
            }
            return y;
        }, (x, y) => {

            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) xdw[i] = yw[i] <= 0.0 ? leaky * ydw[i] : ydw[i]; // threshold
        }, opt);
    }
}

/** Implements SoftPlus nonlinearity elementwise
 * f(x) = ln(1+e^x)
 * the output is in (0, inf)
 */
class SoftPlusLayer extends PActivationLayer {
    constructor(opt) { 
        super('softplus', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) yw[i] = Math.log(1.0 + Math.exp(xw[i]));
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) xdw[i] =  (1.0 - Math.exp(-yw[i])) * ydw[i];
        }, opt);
    }
}


/** Implements Exponential Linear Unit nonlinearity elementwise
 * f(x) =  alpha * (exp(x) - 1.) for x < 0, f(x) = x for x >= 0
 * the output is in (-alpha, inf)
 */
class ELULayer extends ActivationLayer {
    constructor(opt, alpha=1.0) { 
        super('elu', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) { 
                let x = xw[i];
                yw[i] = x < 0.0 ? alpha * (Math.exp(x) - 1.) : x;
            }
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) {
                let y = yw[i];
                xdw[i] = y <= 0.0 ? (y + alpha) * ydw[i] : ydw[i]; // threshold
            }
        }, opt); 
    }
}


/** Implements Sigmoid nonlinearity elementwise
 * x -> 1/(1+e^(-x))
 * so the output is between 0 and 1.
 */
class SigmoidLayer extends ActivationLayer {
    constructor(opt) { 
        super('sigmoid', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) yw[i] = 1.0 / (1.0 + Math.exp(-xw[i]));
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) { 
                let y = yw[i];
                xdw[i] =  y * (1.0 - y) * ydw[i];
            }
        }, opt);
    }
}

/** Implements Hard Sigmoid nonlinearity elementwise
 * x -> 1/(1+e^(-x))
 * so the output is between 0 and 1.
 */
class HardSigmoidLayer extends ActivationLayer {
    constructor(opt) { 
        super('hard_sigmoid', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) {
                let x = xw[i];
                if (x < -1.0) {
                    yw[i] = 0.;
                } else if(x < 1.0) {
                    yw[i] = (x + 1.) / 2.;
                } else {
                    yw[i] = 1.;
                }
            }
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) {
                let y = yw[i];
                xdw[i] = (y >= -1.0 && y <= 1.0) ? 0.5 * ydw[i]: 0.0;
            }
        }, opt); 
    }
}


/** Implements Softsign nonlinearity elementwise
 * x -> x/(1+abs(x))
 * so the output is between -1 and 1.
 */
class SoftSignLayer extends ActivationLayer {
    constructor(opt) { 
        super('softsign', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) {
                let x = xw[i];
                yw[i] = x / (1 + Math.abs(x));
            }
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) {
                let z = 1 - Math.abs(yw[i]);
                xdw[i] = z * z * ydw[i];
            }
        }, opt);
    }
}

/** 
 * Implements Tanh nonlinearity elementwise
 * x -> tanh(x) 
 * so the output is between -1 and 1.
 */
class TanhLayer extends Layer {
    constructor(opt) { 
        super('tanh', (y, x) => {
            let N = x.size, xw = x.w, yw = y.w;
            for (let i = 0; i < N; i++) yw[i] = Math.tanh(xw[i]);
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) {
                let y = yw[i];
                xdw[i] = (1.0 - y * y) * ydw[i];
            }
        }, opt); 
    }
}

/** 
 * This is a classifier, with N discrete classes from 0 to N-1
 * it gets a stream of N incoming numbers and computes the softmax
 * function (exponentiate and normalize to sum to 1 as probabilities should)
 */
class SoftmaxLayer extends Layer {
    constructor(opt) { 
        super('softmax', (y, x) => {
            x.softmax_a(y.w);
            return y;
        }, (x, y) => {
            let N = x.size, xdw = x.dw, yw = y.w, ydw = y.dw;
            for (let i = 0; i < N; i++) { 
                let y = yw[i];
                xdw[i] =  y * (1.0 - y) * ydw[i];
            }
        }, opt); 
    }
}

class MaxoutLayer extends Layer {
    
    // Implements Maxout nonlinearity that computes
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

export { 
    TanhLayer, SoftSignLayer,
    ReLULayer, LeakyReLULayer, ELULayer, SoftPlusLayer,
    MaxoutLayer, SoftmaxLayer,
    HardSigmoidLayer, SigmoidLayer
};


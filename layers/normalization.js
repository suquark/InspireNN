import {Layer} from 'layers/layer.js'

class LocalResponseNormalizationLayer extends Layer {

    constructor(opt) { 
        opt.serialize = ['k', 'n', 'alpha', 'beta'];
        super('lrn', opt);
        // required
        this.k = opt.k;
        this.n = opt.n;
        this.alpha = opt.alpha; // normalize by size
        this.beta = opt.beta;
        // checks
        if (this.n % 2 === 0) { console.log('WARNING n should be odd for LRN layer'); }
    }

    forward(V, is_training) {
        this.in_act = V;

        var A = V.cloneAndZero();
        this.S_cache_ = V.cloneAndZero();
        var n2 = Math.floor(this.n/2);
        for(var x=0;x<V.sx;x++) {
            for(var y=0;y<V.sy;y++) {
                for(var i=0;i<V.depth;i++) {
                    var ai = V.get(x,y,i);
                    // normalize in a window of size n
                    var den = 0.0;
                    for(var j=Math.max(0,i-n2);j<=Math.min(i+n2,V.depth-1);j++) {
                        var aa = V.get(x,y,j);
                        den += aa*aa;
                    }
                    den *= this.alpha / this.n;
                    den += this.k;
                    this.S_cache_.set(x,y,i,den); // will be useful for backprop
                    den = Math.pow(den, this.beta);
                    A.set(x,y,i,ai/den);
                }
            }
        }
        this.out_act = A;
        return this.out_act; // dummy identity function for now
    }

    backward() { 
        // evaluate gradient wrt data
        var V = this.in_act; // we need to set dw of this
        V.dw = global.zeros(V.w.length); // zero out gradient wrt data
        var A = this.out_act; // computed in forward pass 

        var n2 = Math.floor(this.n/2);
        for(var x=0;x<V.sx;x++) {
            for(var y=0;y<V.sy;y++) {
                for(var i=0;i<V.depth;i++) {
                    var chain_grad = this.out_act.get_grad(x,y,i);
                    var S = this.S_cache_.get(x,y,i);
                    var SB = Math.pow(S, this.beta);
                    var SB2 = SB*SB;

                    // normalize in a window of size n
                    for(var j=Math.max(0,i-n2);j<=Math.min(i+n2,V.depth-1);j++) {              
                      var aj = V.get(x,y,j); 
                      var g = -aj*this.beta*Math.pow(S,this.beta-1)*this.alpha/this.n*2*aj;
                      if(j===i) g+= SB;
                      g /= SB2;
                      g *= chain_grad;
                      V.add_grad(x,y,j,g);
                    }
                }
            }
        }
    }
}

export { LocalResponseNormalizationLayer };


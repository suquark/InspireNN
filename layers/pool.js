import { zeros } from 'convnet_util';
import Layer from 'layer'
import getopt from '../convnet_util'

class PoolLayer extends Layer {

    constructor(opt) { 
        opt.serialize = ['sx', 'sy', 'stride', 'in_depth', 'pad'];
        super('pool', opt);
        // required
        this.sx = opt.sx; // filter size
        this.in_depth = opt.in_depth;
        this.in_sx = opt.in_sx;
        this.in_sy = opt.in_sy;

        // optional
        
        this.sy = getopt(opt, 'sy', this.sx);
        this.stride = getopt(opt, 'stride', 2);
        this.pad = getopt(opt, 'pad', 0); // amount of 0 padding to add around borders of input volume

        // computed
        this.out_depth = this.in_depth;
        this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
        this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);

        // store switches for x,y coordinates for where the max comes from, for each output neuron
        this.switchx = this.createOutput();
        this.switchy = this.createOutput();
    }

    forward(V, is_training) {
        this.in_act = V;

        let A = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
        
        let n = 0; // a counter for switches
        for (let d = 0; d < this.out_depth; d++) {
            let x = -this.pad;
            let y = -this.pad;
            for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
                y = -this.pad;
                for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {
                    // convolve centered at this particular location
                    var a = -99999; // hopefully small enough ;\
                    let winx = -1, winy = -1;
                    for(let fx=0;fx<this.sx;fx++) {
                        for(let fy=0;fy<this.sy;fy++) {
                            var oy = y+fy;
                            var ox = x+fx;
                            if(oy>=0 && oy<V.sy && ox>=0 && ox<V.sx) {
                                let v = V.get(ox, oy, d);
                                // perform max pooling and store pointers to where
                                // the max came from. This will speed up backprop 
                                // and can help make nice visualizations in future
                                if(v > a) { a = v; winx=ox; winy=oy;}
                            }
                        }
                    }
                    this.switchx[n] = winx;
                    this.switchy[n] = winy;
                    n++;
                    A.set(ax, ay, d, a);
                }
            }
        }
        this.out_act = A;
        return this.out_act;
    }

    backward() { 
        // pooling layers have no parameters, so simply compute 
        // gradient wrt data here
        var V = this.in_act;
        V.dw.fill(0.); // zero out gradient wrt data
        var A = this.out_act; // computed in forward pass 

        var n = 0;
        for (var d = 0; d < this.out_depth; d++) {
            var x = -this.pad;
            var y = -this.pad;
            for (var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
                y = -this.pad;
                for (let ay = 0; ay < this.out_sy; y += this.stride, ay++) {
                    let chain_grad = this.out_act.get_grad(ax, ay, d);
                    V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
                    n++;
                }
            }
        }
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.pad = this.pad || 0; // backwards compatibility
        this.switchx = this.createOutput(); // need to re-init these appropriately
        this.switchy = this.createOutput();
    }

}

export { PoolLayer };

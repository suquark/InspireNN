import { Layer } from 'layer'
import { Vol } from '../convnet_vol'
import getopt from '../convnet_util'
import get_optimizer from 'optimizer'

// This file contains all layers that do dot products with input,
// but usually in a different connectivity pattern and weight sharing
// schemes: 
// - FullyConn is fully connected dot products 
// - ConvLayer does convolutions (so weight sharing spatially)
// putting them together in one file because they are very similar

class ConvLayer extends Layer {
    constructor (opt) {
        // sx, sy : filter size in x, y dims
        // in_depth : depth of input volume
        opt.serialize = ['sx', 'sy', 'stride', 'in_depth', 'pad', 'l1_decay_mul', 'l2_decay_mul'];
        super('conv', opt);

        // required
        this.out_depth = opt.filters;
        this.sx = opt.sx; // filter size. Should be odd if possible, it's cleaner.
        this.in_depth = opt.in_depth;
        this.in_sx = opt.in_sx;
        this.in_sy = opt.in_sy;

        // optional, like pooling layer
        this.sy = getopt(opt, 'sy', this.sx);
        this.stride = getopt(opt, 'stride', 1); // 1 not 2 in pool
        this.pad = getopt(opt, 'pad', 0); // amount of 0 padding to add around borders of input volume
        this.l1_decay_mul = getopt(opt, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(opt, 'l2_decay_mul', 1.0);

        // computed
        // note we are doing floor, so if the strided convolution of the filter doesnt fit into the input
        // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
        // final application.
        this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
        this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
      
      
        // initializations
        let bias = getopt(opt, 'bias_pref', 0.0);
        this.filters = [];
        for (var i = 0; i < this.out_depth; i++) 
        { 
            this.filters.push(new Vol(1, 1, this.num_inputs)); 
        }
        this.biases = new Vol(1, 1, this.out_depth, bias);

        // record updated values for updating
        this.updated = this.filters.concat([this.biases]);
    }

    forward(V, is_training) {
        // optimized code by @mdda that achieves 2x speedup over previous version

        this.in_act = V;
        var A = new Vol(this.out_sx |0, this.out_sy |0, this.out_depth |0, 0.0);
        
        var V_sx = V.sx |0;
        var V_sy = V.sy |0;
        var xy_stride = this.stride |0;

        for (var d = 0; d < this.out_depth; d++) {
            var f = this.filters[d];
            var x = -this.pad |0;
            var y = -this.pad |0;
            for (var ay=0; ay<this.out_sy; y+=xy_stride,ay++) {  // xy_stride
                x = -this.pad |0;
                for (var ax=0; ax<this.out_sx; x+=xy_stride,ax++) {  // xy_stride

                    // convolve centered at this particular location
                    var a = 0.0;
                    for (var fy=0;fy<f.sy;fy++) {
                        var oy = y+fy; // coordinates in the original input array coordinates
                        for (var fx=0;fx<f.sx;fx++) {
                            var ox = x+fx;
                            if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx) {
                                for (var fd=0;fd<f.depth;fd++) {
                                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                                    a += f.w[((f.sx * fy)+fx)*f.depth+fd] * V.w[((V_sx * oy)+ox)*V.depth+fd];
                                }
                            }
                        }
                    }
                    a += this.biases.w[d];
                    A.set(ax, ay, d, a);
                }
            }
        }
        this.out_act = A;
        return this.out_act;
    }

    backward() {
        var V = this.in_act;
        V.dw.fill(0); // zero out gradient wrt bottom data, we're about to fill it

        var V_sx = V.sx |0;
        var V_sy = V.sy |0;
        var xy_stride = this.stride |0;

        for (var d=0;d<this.out_depth;d++) {
            var f = this.filters[d];
            var x = -this.pad |0;
            var y = -this.pad |0;
            for (var ay=0; ay<this.out_sy; y+=xy_stride,ay++) {  // xy_stride
                x = -this.pad |0;
                for (var ax=0; ax<this.out_sx; x+=xy_stride,ax++) {  // xy_stride
                    // convolve centered at this particular location
                    var chain_grad = this.out_act.get_grad(ax,ay,d); // gradient from above, from chain rule
                    for (var fy=0;fy<f.sy;fy++) {
                        var oy = y+fy; // coordinates in the original input array coordinates
                        for (var fx=0;fx<f.sx;fx++) {
                            var ox = x+fx;
                            if (oy>=0 && oy<V_sy && ox>=0 && ox<V_sx) {
                                for (var fd=0;fd<f.depth;fd++) {
                                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                                    var ix1 = ((V_sx * oy)+ox)*V.depth+fd;
                                    var ix2 = ((f.sx * fy)+fx)*f.depth+fd;
                                    f.dw[ix2] += V.w[ix1]*chain_grad;
                                    V.dw[ix1] += f.w[ix2]*chain_grad;
                                }
                            }
                        }
                    }
                    this.biases.dw[d] += chain_grad;
                }
            }
        }
    }
    
    getParamsAndGrads() {
        let response = this.filters.map(x => this._pack_vars(x));
        response.push(this._pack_vars(this.biases, false)); 
        return response;
    }

    toJSON() {
        var json = super.toJSON();
        json.filters = this.filters.map(x => x.toJSON());
        json.biases = this.biases.toJSON();
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);

        this.pad = getopt(json, 'pad', 0); 
        this.l1_decay_mul = getopt(json, 'l1_decay_mul', 1.0);
        this.l2_decay_mul = getopt(json, 'l2_decay_mul', 1.0);
        
        this.filters = json.filters.map(x => new Vol(0,0,0,0).fromJSON(x));
        this.biases = new Vol(0,0,0,0).fromJSON(json.biases);
    }

}

export { ConvLayer };

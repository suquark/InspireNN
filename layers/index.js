import { InputLayer } from 'layers/layer.js';
import { ReLULayer, SigmoidLayer, TanhLayer, MaxoutLayer } from 'layers/activation.js';
import { PoolLayer } from 'layers/pool.js';
import { SVMLayer } from 'layers/svm.js';
import { SoftmaxLayer } from 'layers/softmax.js';
import { RegressionLayer } from 'layers/regression.js';
import { FullyConnLayer } from 'layers/fullconn.js';
import { ConvLayer } from 'layers/conv.js';
import { LocalResponseNormalizationLayer } from 'layers/normalization.js';
import { DropoutLayer } from 'layers/dropout.js';
import { DeconvLayer } from 'layers/deconv.js';

var layer_dict = {
    'input' : InputLayer,
    'relu' : ReLULayer,
    'sigmoid' : SigmoidLayer,
    'tanh' : TanhLayer,
    'dropout' : DropoutLayer,
    'conv' : ConvLayer,
    'deconv' : DeconvLayer,
    'pool' : PoolLayer,
    'lrn'  : LocalResponseNormalizationLayer,
    'fc' : FullyConnLayer,
    'maxout' : MaxoutLayer,
    'svm' : SVMLayer
}

export function get_layer(opt) {
    return new layer_dict[opt.type || opt.layer_type](opt);
}
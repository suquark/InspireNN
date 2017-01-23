import { InputLayer } from 'layers/layer';
import { ReluLayer, SigmoidLayer, TanhLayer, MaxoutLayer } from 'layers/activation';
import { PoolLayer } from 'layers/pool';
import { SVMLayer } from 'layers/svm';
import { SoftmaxLayer } from 'layers/softmax';
import { RegressionLayer } from 'layers/regression';
import { FullyConnLayer } from 'layers/fullconn';
import { ConvLayer } from 'layers/conv';
import { LocalResponseNormalizationLayer } from 'layers/normalization';
import { DropoutLayer } from 'layers/dropout';

layer_dict = {
    'input' : InputLayer,
    'relu' : ReluLayer,
    'sigmoid' : SigmoidLayer,
    'tanh' : TanhLayer,
    'dropout' : DropoutLayer,
    'conv' : ConvLayer,
    'pool' : PoolLayer,
    'lrn'  : LocalResponseNormalizationLayer,
    'softmax' : SoftmaxLayer,
    'regression' : RegressionLayer,
    'fc' : FullyConnLayer,
    'maxout' : MaxoutLayer,
    'svm' : SVMLayer
}

export function get_layer(opt) {
    return new layer_dict[opt.type || opt.layer_type](opt);
}
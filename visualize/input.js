import { Vector } from 'vol.js';

function sliders2Vector(sliders, prep=x=>x) {
    let arr = sliders.map(s => prep(s.value));
    let N = sliders.length;
    let v = new Vector(N);  // TODO: after change into tensor, use `new Vector(N, arr)` instead
    for (let i = 0; i < N; i++) v.w[i] = arr[i];
    return v;
}

export { sliders2Vector };

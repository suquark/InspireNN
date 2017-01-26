
class Digestion {
    
    constructor(gain, effect) {
        this.gain = health_setting.gain;
        this.effect = health_setting.effect || {};
        this.digestion_signal = 0.0;
    } 

    eat(item) {
        // ding! nom nom nom
        for (let eff in this.effect) {
            item[eff] = this.effect[eff];
        }
        // mmm delicious apple
        // ewww poison
        for (let attr in this.gain) {
            this.digestion_signal += this.gain[attr][item[attr]];
        }
    }

    fetch_one(info, judger) {
        let r = judger(info);
        if (r.length > 0) eat(r[0]);
    }

    get signal() {
        return this.digestion_signal;
    }

    get checkout() {
        let a = this.signal;
        this.digestion_signal = 0.0;
        return a;
    }


}

export { Digestion };
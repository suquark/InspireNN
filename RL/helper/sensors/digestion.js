
class Digestion {
    
    constructor(gain) {
        this.gain = gain;
        //this.effect = effect || {};
        this.digestion_signal = 0.0;
    } 

    eat(item) {
        // ding! nom nom nom

        // mmm delicious apple
        // ewww poison
        for (let attr in this.gain) {
            this.digestion_signal += this.gain[attr][item[attr]];
        }
        // return eaten one
        return item;
    }

    fetch_one(r) {
        // eat 1st policy
        if (r.length > 0) return this.eat(r[0]);
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
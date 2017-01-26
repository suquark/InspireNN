import { randf, randi } from 'util.js';
import { Circle, Line, Vec } from '../geometry.js';
    
class Item {
    // item is circle thing on the floor that agent can interact with (see or eat, etc)
    constructor(x, y, type) {
        // this.p = new Vec(x, y); // position
        // this.rad = 10; // default radius
        this.type = type;
        
        this.circle = new Circle(x, y, 10); // item shape

        this.age = 0;
        this.alive = true;
    }
}

class ItemLifetime {
    constructor(W, H, init_count) {
        this.items = [];
        this.W = W;
        this.H = H;
        for (let i = 0; i < init_count; i++) this.create();
        this.someone_dead = false;
    }

    push(item) {
        this.items.push(item);
    }
    
    recycle() {
        if (someone_dead) {
            this.items = this.items.filter(x => x.alive);
        }
    }

    kill(item) {
        item.alive = false;
        this.someone_dead = true;
    }

    dead() {
        for (let i in this.items) {
            if (this.items[i] > 5000 && randf(0, 1) < 0.1) {
                // replace this one, has been around too long
                this.kill(this.items[i]);
            }
        }
    }

    birth() {
        if (this.items.length < 30 && randf(0, 1) < 0.25) {
            this.create();
        }
    }

    aging() {
        for (let i in this.items) {
            this.items[i].age++;
        }
    }

    create() {
        var x = randf(20, this.W - 20);
        var y = randf(20, this.H - 20);
        var t = randi(1, 3); // food or poison (1 and 2)
        var it = new Item(x, y, t);
        this.items.push(it);
    }

    draw() {
        // draw items
        ctx.strokeStyle = "rgb(0, 0, 0)";
        for(let i in this.items) {
            let it = this.items[i];
            if (it.type === 1) ctx.fillStyle = "rgb(255, 150, 150)";
            if (it.type === 2) ctx.fillStyle = "rgb(150, 255, 150)";
            this.circle.draw(ctx);
        }
    }

    intersect(l) {
        // closest intersect with items
        // not very efficient, you can splitting the space to make it better
        let minres = false;
        for (let i in this.items) {
            var item = this.items[i];
            // javascript is fine for this
            var result = this.circle.intersect(l);  // line_point_intersect(p1, p2, it.p, it.rad);
            if (result) {
                result.type = this.type; // 0 is wall
                if (!minres) { minres = res; }
                else if(res.ua < minres.ua) { // check if its closer
                    // if yes replace it
                    minres = res;
                }
            }
        }
        return minres;
    }

    hit(circ) {
        return this.items.filter(it => circ.intersect_circle(it.circle));
    }

    get position() {
        return this.circle.a;
    }

}
    
export { ItemLifetime };

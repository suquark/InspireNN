import { ItemLifetime } from './objects/item.js';
import { Walls } from './objects/wall.js';
import { near_intersect, Vec } from './geometry.js';
    
class World {
    constructor(width, height, agent) {
        // this.agents = [];
        this.W = width;
        this.H = height;
        this.agent = agent;
        
        // setup time
        this.clock = 0;
        
        // set up walls in the world
        this.walls = new Walls(); 

        this.walls.add_outer_wall(this.W, this.H, 10);
        this.walls.add_open_box(100, 100, 200, 300); // inner walls
        this.walls.add_open_box(400, 100, 200, 300);

        //this.walls.create(new Vec(0, 55), new Vec(700, 55));
        //this.walls.create(new Vec(0, 55), new Vec(700, 50));

        // this.walls.create(new Vec(0, 200), new Vec(700, 200));
        // this.walls.create(new Vec(0, 300), new Vec(700, 300));
        // this.walls.create(new Vec(0, 400), new Vec(700, 400));
        
        // set up food and poison
        this.items = new ItemLifetime(this.W, this.H, 30);
    }

    tick() {
        // tick the environment
        this.clock++;
        
        // fix input to all agents based on environment
        // process eyes

        // helper function to get closest colliding walls/items
        this.agent.eyes.interact(line => {
            // collide with walls
            let minr0 = this.walls.intersect(line);
            // collide with items
            let minr1 = this.items.intersect(line);
            return near_intersect(minr0, minr1);
        }); // oh javascript :\
        
        // let the agents behave in the world based on their input
        this.agent.forward();

        // save old state for painting ...
        this.agent.old_face = this.agent.face.clone();
        
        // apply outputs of agents on environment
        // steer the agent according to outputs of wheel velocities
        let face = this.agent.reaction();
        
        // agent is trying to move. Check walls
        if (!this.walls.cross(this.agent.position, face.origin)) {
            this.agent.move(face);
            // handle boundary conditions, maybe optional
            this.agent.face.apply_clip_rect(0, 0, this.W, this.H);
        } else {
            // stop move, but must update angle !!!!! or it will stuck
            this.agent.face.angle = face.angle;
        }
        
        // +1s
        this.items.aging();
        
        // fetch food
        let touches = this.items.hit(this.agent.circle); // see if some agent gets lunch
        if (touches.length > 0) {
            // not cross the wall        
            touches = touches.filter(it => !this.walls.cross(this.agent.position, it.position));
            let eaten = this.agent.digest.fetch_one(touches);
            this.items.kill(eaten);
        }
        
        // simulate dead
        if (this.clock % 100 === 0) this.items.dead();
        // recycle dead and killed
        this.items.recycle();
        // simulate birth
        if (this.clock % 10 === 0) this.items.birth();
        
        // agents are given the opportunity to learn based on feedback of their action on environment
        this.agent.backward();
    }

    draw(canvas) {
        let ctx = canvas.getContext("2d");
        // clear 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // draw walls
        this.walls.draw(ctx);
        // draw agents
        this.agent.draw(ctx);
        // draw items
        this.items.draw(ctx);
    }
}
    
export { World };

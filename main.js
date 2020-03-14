//constants:
var width = window.innerWidth;
var height = window.innerHeight;
var PARTICLE_R = 5;
var PARTICLES_PER_CHUNK = 25;
var PARTICLES_MASS = 1;
var PARTICLE_VERTS=15;
var BALTZMANN = 1.380649; 
var IDEAL_GAS_CONSTANT = 8.314;
var MAX_PARTICLES = 2500;


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.autoRotate = false;
controls.enableKeys=false;
controls.enablePan =false;


camera.position.y = 160;
camera.position.z = 400;
camera.lookAt (new THREE.Vector3(0,0,0));
controls.update();

var light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 0, 50, 0 );
scene.add(light);
var light2 = new THREE.DirectionalLight( 0xffffff, 1 );
light2.position.set( 50, 50, 50 );
scene.add(light2);

var helper = new THREE.DirectionalLightHelper( light2, 5 );
//scene.add( helper );

var pGeometry = new THREE.SphereGeometry( this.r, PARTICLE_VERTS, PARTICLE_VERTS );
var pMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00} );
var pMesh = new THREE.Mesh( pGeometry, pMaterial );


function rand(min, max){
    return Math.random() * (max - min) + min;
}




class Particle{

    constructor(x,y,z,p){

        this.init = true;
        this.r = PARTICLE_R;
        this.x=x;
        this.y=y;
        this.z=z;
        this.material = pMaterial;
        this.geometry = pGeometry;
        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.parent = p;
        this.mesh.position.set(x,y,z);
        scene.add(this.mesh);
        this.currentChunk = 0;
        
        this.velocity = new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1));
        this.mass = PARTICLES_MASS;
        this.alreadyBounced = false;

    }

    distTo(p){

        this.locVec = new THREE.Vector3(this.x,this.y,this.z);
        p.locVec = new THREE.Vector3(p.x,p.y,p.z);
        return this.locVec.distanceTo(p.locVec);

    }


    collide(){

        for(var i = 0; i < this.parent.chunks[this.currentChunk].length;i++){
            var other = this.parent.chunks[this.currentChunk][i];
            if(!other.alreadyBounced&&this!=other){

                if(this.distTo(other)<2*PARTICLE_R){ //if collided
                    
                    var dx = other.x-this.x;
                    var dy = other.y-this.y;
                    var dz = other.z-this.z;

                    var dvx = other.velocity.x-this.velocity.x;
                    var dvy = other.velocity.y-this.velocity.y;
                    var dvz = other.velocity.z-this.velocity.z;

                    var dvdr = dx*dvx + dy*dvy + dz*dvz;
                    var distance = 2*PARTICLE_R;

                    var magnitude = 2 * this.mass * other.mass * dvdr / ((this.mass + other.mass) * distance);

                    var fx = magnitude * dx / distance;
                    var fy = magnitude * dy/ distance;
                    var fz = magnitude * dz / distance;

                    this.velocity.x += fx / this.mass;
                    this.velocity.y += fy / this.mass;
                    this.velocity.z += fz / this.mass;

                    other.velocity.x -= fx/other.mass;
                    other.velocity.y -= fy/other.mass;
                    other.velocity.z -= fz/other.mass;

                }


            }
        }

        this.currentChunk++;
        if(this.currentChunk>=this.parent.chunks.length){
            this.currentChunk=0;
        }
    }


    update(){
        if(!this.init){return false;}

        this.x+=this.velocity.x;
        this.y+=this.velocity.y;
        this.z+=this.velocity.z;
        this.mesh.position.set(this.x,this.y,this.z);

        if(this.x>this.parent.xBound||this.x<-this.parent.xBound){
            this.velocity.x*=-1;
        }
        if(this.y>this.parent.yBound||this.y<-this.parent.yBound){
            this.velocity.y*=-1;
        }
        if(this.z>this.parent.zBound||this.z<-this.parent.zBound){
            this.velocity.z*=-1;
        }


        //chemistry:
        


    }


}



class Context{

    constructor(scene,l,w,h){

        this.init = true;
        this.geometry = new THREE.BoxGeometry(l,w,h);
        this.material = new THREE.MeshBasicMaterial( { color: 0x111111, opacity:0.0, transparent:true } );
        
        this.material.needsUpdate = true;
        this.edges = new THREE.EdgesGeometry(this.geometry)
        this.cube = new THREE.Mesh( this.geometry, this.material );
        this.line = new THREE.LineSegments(this.edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) )
        
        //scene.add( this.cube );
        scene.add(this.line);

        this.cube.position.set(0,0,0);
        this.currentChunk=0;
        this.availableChunk = 0;
        this.chunks = [new Array(0)];



        //maths
        this.length = l;
        this.height = h;
        this.width = w;
        this.volume = l*w*h;

        this.temperature = 298.15;
        this.pressure = 1;
        this.particleCount = 0;

        //bounding:

        this.xBound = w/2;
        this.yBound = h/2;
        this.zBound = l/2;

    }


    clear(){

        this.chunks = [new Array(0)];
        this.currentChunk=0;
        this.particleCount=0;
    }


    update(){
        if(!this.init){return false;}
        if(this.particleCount==0){return false;}

        for(var i = 0; i < this.chunks[this.currentChunk].length;i++){

            this.chunks[this.currentChunk][i].update();
            this.chunks[this.currentChunk][i].collide();
            //console.log("updating Chunk");
        }

        for(var i = 0 ; i < this.chunks.length; i++){
            if(i!=this.currentChunk){
                for(var j = 0; j < this.chunks[i].length;j++){
                    this.chunks[i][j].update();
                }
            }
        }


        this.currentChunk++;
        if(this.currentChunk>=this.chunks.length){
            this.currentChunk=0;
        }
        this.volume = this.length*this.width*this.height;


    }

    getVolume(){

        this.volume = this.length*this.width*this.height;
        return this.volume;

    }

    getPressure(){

        this.pressure = (this.particleCount*this.temperature*IDEAL_GAS_CONSTANT)/this.volume;
        return this.pressure;

    }


    push(p){
        if(!this.init){return false;}
        if(this.particleCount+1 >= MAX_PARTICLES){return false;}
        this.chunks[this.availableChunk].push(p);
        if(this.chunks[this.availableChunk].length>=PARTICLES_PER_CHUNK){
            this.availableChunk++;
            this.chunks.push(new Array(0));
        }

        this.particleCount++;

    }


}

class HUD{

    constructor(cntxt, w,h){
        this.width = w;
        this.height = h;
        this.context = cntxt;

    }


    render(){

        
    }


}



function burstOfGas(){

    for(var i = 0; i < 100; i ++){
        //context.push(new Particle(rand(-10,10),rand(-10,10),rand(-10,10),context));
        context.push(new Particle(0,0,0,context));
    }
}


var context = new Context(scene,100,100,100);
var hud = new HUD(context, width, height);


var gridXZ = new THREE.GridHelper(100, 10,new THREE.Color(0xff0000), new THREE.Color(0xffffff));
//scene.add(gridXZ);

//burstOfGas();

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();
    context.update();

    if(context.particleCount<500){
        context.push(new Particle(rand(-context.xBound,context.xBound),rand(-context.yBound,context.yBound),rand(-context.zBound,context.zBound),context));
    }

    

    renderer.render( scene, camera );
    hud.render();
};



animate();
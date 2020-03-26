/////////////////////////
//@author: Philo Kaulkin - https://github.com/Phil0nator
//
//
//
//
////////////////////////
//constants:
var width = window.innerWidth;
var height = window.innerHeight;
var PARTICLE_R =.5;
var PARTICLES_PER_CHUNK = 25;
var PARTICLES_MASS = 1;
var PARTICLE_VERTS=6;
var BALTZMANN = 1.380649; 
var IDEAL_GAS_CONSTANT = 8.314;
var MAX_PARTICLES = 2500;
var MIN_VOLUME = 1000;
var MAX_VOLUME = 1000000;

var CONSTANT = "NONE";
var PAUSED = false;

let gridXZ;

//buttons:
var DVactive=false;
var IVactive = false;
var APactive = false;
var Cactive = false;
var ITactive=false;
var DTactive =false;
var RPactive=false;

function DVMD(){DVactive=true;}
function DVMU(){DVactive=false;}
function IVMD(){IVactive=true;}
function IVMU(){IVactive=false;}
function APMD(){APactive=true;}
function APMU(){APactive=false;}
function CMD(){Cactive=true;}
function CMU(){Cactive=false;}
function ITMD(){ITactive=true;}
function ITMU(){ITactive=false;}
function DTMD(){DTactive=true;}
function DTMU(){DTactive=false;}
function RPMD(){RPactive=true;}
function RPMU(){RPactive=false;}

function TG(){gridXZ.visible=!gridXZ.visible;}


var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x555555 );
//var fog = 1000;
//scene.fog = new THREE.Fog( 0xffffff, fog, fog + 1000 );
var Amblight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( Amblight );
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
controls.maxPolarAngle = Math.PI/2;
controls.maxDistance = 1000;

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

var pGeometry = new THREE.SphereGeometry( PARTICLE_R, PARTICLE_VERTS, PARTICLE_VERTS );
var pMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00} );
var pMesh = new THREE.Mesh( pGeometry, pMaterial );



function remove_linebreaks( str ) {
    return str.replace( /[\r\n]+/gm, "" );
}

function truncDisp(s, dgs){
    return remove_linebreaks(s.toString().substring(0, s.toString().indexOf(".") + dgs))   
}
function getCONSTANT(){
    return "C"+CONSTANT;
}

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

    destroy(){

        scene.remove(this.mesh);
        //delete this;

    }

    distTo(p){

        this.locVec = new THREE.Vector3(this.x,this.y,this.z);
        p.locVec = new THREE.Vector3(p.x,p.y,p.z);
        return this.locVec.distanceTo(p.locVec);

    }

    getSpeed(){

        return this.velocity.length();

    }


    collide(){
        
        for(var i = 0; i < this.parent.chunks[this.currentChunk].length;i++){
            var other = this.parent.chunks[this.currentChunk][i];
            if(!other.alreadyBounced&&this!=other){

                if(this.distTo(other)</*2 **/PARTICLE_R){ //if collided
                    this.parent.colls++;
                    this.alreadyBounced=true;
                    other.alreadyBounced=true;

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
        this.alreadyBounced=false;
        this.x+=this.velocity.x;
        this.y+=this.velocity.y;
        this.z+=this.velocity.z;
        this.mesh.position.set(this.x,this.y,this.z);

        if(this.getSpeed()<.01&&this.parent.getTemperature()>0){
            this.velocity = new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1));
        }

        if(this.x>this.parent.xBound||this.x<-this.parent.xBound){
            this.velocity.x*=-1;
            this.parent.colls++;
        }
        if(this.y>this.parent.yBound||this.y<-this.parent.yBound){
            this.velocity.y*=-1;
            this.parent.colls++;
        }
        if(this.z>this.parent.zBound||this.z<-this.parent.zBound){
            this.velocity.z*=-1;
            this.parent.colls++;
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
        this.line.dynamic=true;
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
        this.colls = 0;



        this.constant_temp = this.temperature;
        this.constant_pressure = 0;
        this.constant_volume = this.volume;
        this.constant_pressurevtemp = 0;
        this.constant_pressurevvol = 0;



        //bounding:

        this.xBound = w/2;
        this.yBound = h/2;
        this.zBound = l/2;

    }

    pop(){ //remove last particle
        if(!this.init){return false;}
        if(this.particleCount<=0){
            RPactive=false;
            return;
        }
        if(this.chunks[this.availableChunk].length>0){
            this.chunks[this.availableChunk][this.chunks[this.availableChunk].length-1].destroy();
            this.chunks[this.availableChunk].pop();
            this.particleCount--;
        }else{
            this.availableChunk--;
            this.pop();
        }



    }

    reBuffer(){ //resize physical geometry
        scene.remove(this.line);
        this.geometry = new THREE.BoxGeometry(this.length,this.width,this.height);
        this.edges = new THREE.EdgesGeometry(this.geometry);
        this.line = new THREE.LineSegments(this.edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) );
        
        this.line.needsUpdate=true;
        this.line.updateMatrix();
        scene.add(this.line);
        this.xBound = this.width/2;
        this.yBound = this.height/2;
        this.zBound = this.length/2;

        

    }


    clear(){ //remove all particles
        for(var i = 0 ; i < this.chunks.length;i++){
            for(var j = 0 ; j < this.chunks[i].length;j++){
                var p = this.chunks[i][j];
                p.destroy();
            }
        }
        this.chunks = [new Array(0)];
        this.currentChunk=0;
        this.particleCount=0;
        this.colls = 0;
        this.availableChunk=0;
    }


    update(){ //frame update
        if(!this.init){return false;}
        if(this.particleCount==0){
            document.getElementById("RP").disabled = true;
            
            document.getElementById("CNONE").onclick();
            return false;
        }else{
            document.getElementById("RP").disabled = false;

        }
        if(this.temperature <=0){return false;}

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
            reContainGas();
        }
        this.volume = this.length*this.width*this.height;



        switch(getCONSTANT()){ //handle changing of constant values
            case "CNONE":
                this.constant_temp = this.temperature;
                this.constant_pressure = this.pressure;
                this.constant_volume = this.volume;
                this.constant_pressurevtemp = this.pressure / this.temperature;
                this.constant_pressurevvol = this.pressure / this.volume;
                break;
            case "CTEMPERATURE":
                //this.constant_temp = this.temperature;
                this.constant_pressure = this.pressure;
                this.constant_volume = this.volume;
                this.constant_pressurevtemp = this.pressure / this.temperature;
                this.constant_pressurevvol = this.pressure / this.volume;
                break;
            case "CVOLUME":
                this.constant_temp = this.temperature;
                this.constant_pressure = this.pressure;
                //this.constant_volume = this.volume;
                this.constant_pressurevtemp = this.pressure / this.temperature;
                this.constant_pressurevvol = this.pressure / this.volume;
                break;
            case "CPRESSURE vs VOLUME":
                this.constant_temp = this.temperature;
                //this.constant_pressure = this.pressure;
                //this.constant_volume = this.volume;
                this.constant_pressurevtemp = this.pressure / this.temperature;
                //this.constant_pressurevvol = this.pressure / this.volume;
                if(this.pressure != this.constant_pressure){
                    
                    var deltaVol = (this.pressure-this.constant_pressure);
                    this.length+=deltaVol;
                    this.width+=deltaVol;
                    this.height+=deltaVol;
                    this.reBuffer();
                }
                break;

                
                


            case "CPRESSURE vs TEMPERATURE":
                //this.constant_temp = this.temperature;
                //this.constant_pressure = this.pressure;
                this.constant_volume = this.volume;
                //this.constant_pressurevtemp = this.pressure / this.temperature;
                this.constant_pressurevvol = this.pressure / this.volume;
                if(this.pressure != this.constant_pressure && Math.abs(this.pressure - this.constant_pressure)>.01){
                    
                    if(this.pressure>this.constant_pressure){
                        decreaseTemperature();

                    }else{
                        increaseTemperature();
                    }
                    
                }

                break;
        }



    }

    getVolume(){ 
        if(getCONSTANT()!="CVOLUME"){
            this.volume = this.length*this.width*this.height;
        }


        return this.volume;

    }

    getPressure(){
        if(getCONSTANT() != "CPRESSURE vs VOLUME" && getCONSTANT() != "CPRESSURE vs TEMPERATURE"){
            this.pressure = (this.particleCount*this.temperature*IDEAL_GAS_CONSTANT)/this.volume;
        }else{
            this.pressure = (this.particleCount*this.temperature*IDEAL_GAS_CONSTANT)/this.volume;
            return(truncDisp(this.constant_pressure, 4));
        }
        return truncDisp(this.pressure, 4);

    }

    getTemperature(){


        //this.temperature = (this.getPressure()*this.getVolume())/(this.particleCount*IDEAL_GAS_CONSTANT);
        //return truncDisp(this.temperature,4);
        return this.temperature;

    }

    getRootMeanSquaredVelocity(){
        return truncDisp(Math.sqrt(3*IDEAL_GAS_CONSTANT*this.getTemperature()),5);
    }

    push(p){ //add new particle (given by p)
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

class HUD{ //handler for updating DOM elements

    constructor(cntxt, w,h){
        this.width = w;
        this.height = h;
        this.context = cntxt;

        this.standardCSS = "z-index: 265;position:absolute;color:aliceblue";

        this._info = document.getElementById('info');

        this._htmlParent = document.getElementById("hud");
        
        this.frameDelay=0;
    }


    render(){ //frame update
        this.frameDelay++;
        if(this.frameDelay<10){
            return;
        }else{
            this.frameDelay=0;
        }
        if(this.context.particleCount>0){
            this._info.innerHTML = "Information: <br />";
            this._info.innerHTML+="Pressure: "+this.context.getPressure()+" atm<br />";
            this._info.innerHTML+="Volume: "+this.context.getVolume()+"nm<sup>3</sup>   ::   ( "+truncDisp(this.context.width, 2)+"nm x "+truncDisp(this.context.height, 2)+"nm x "+truncDisp(this.context.length, 2)+"nm )<br />";
            this._info.innerHTML+="Temperature: "+this.context.getTemperature()+"K <br />";
            this._info.innerHTML+="Particles: "+this.context.particleCount+"<br />";
            this._info.innerHTML+="Root-Mean-Squared Velocity: "+this.context.getRootMeanSquaredVelocity()+" m/s<br />";
            this._info.innerHTML+="Collisions: "+this.context.colls+"<br />";
            this._info.innerHTML+="Constant Variable: "+CONSTANT+"<br />";
        }else{
            this._info.innerHTML = "Information: <br />";
            this._info.innerHTML+="Pressure: -- <br />";
            this._info.innerHTML+="Volume: --<br />";
            this._info.innerHTML+="Temperature: -- <br />";
            this._info.innerHTML+="Particles: 0<br />";
            this._info.innerHTML+="Root-Mean-Squared Velocity: -- <br />";
            this._info.innerHTML+="Collisions: 0 <br />";
            this._info.innerHTML+="Constant Variable: <u>"+CONSTANT+"</u><br />";
        }
    }


}



function burstOfGas(){

    for(var i = 0; i < 100; i ++){
        //context.push(new Particle(rand(-10,10),rand(-10,10),rand(-10,10),context));
        context.push(new Particle(0,0,0,context));
    }
}
var context = new Context(scene,50,50,50);
var hud = new HUD(context, width, height);


function reContainGas(){
    for(var i = 0 ; i < context.chunks.length;i++){
        for(var j = 0 ; j < context.chunks[i].length;j++){
            var p = context.chunks[i][j];
            
            if(p.x>context.xBound){
                p.x=context.xBound;
            }else if (p.x<-context.xBound){
                p.x=-context.xBound;
            }
            if(p.y>context.yBound){
                p.y=context.yBound;
            }else if (p.y<-context.yBound){
                p.y=-context.yBound;
            }
            if(p.z>context.zBound){
                p.z=context.zBound;
            }else if (p.z<-context.zBound){
                p.z=-context.zBound;
            }
            
        }
    }
}
function applyDeltaT(deltaPos){
    for(var i = 0 ; i < context.chunks.length;i++){
        for(var j = 0 ; j < context.chunks[i].length;j++){
            var p = context.chunks[i][j];
            

            if(deltaPos){
                p.velocity.x*=1.01;
                p.velocity.y*=1.01;
                p.velocity.z*=1.01;
                if(context.temperature == 0){
                    p.velocity.x=.1;
                    p.velocity.y=.1;
                    p.velocity.z=.1;
                }
            }else{
                p.velocity.x/=1.01;
                p.velocity.y/=1.01;
                p.velocity.z/=1.01;
                if(context.temperature == 0){
                    p.velocity.x=0;
                    p.velocity.y=0;
                    p.velocity.z=0;
                }
            }
        }
    }
}


//<USER CONTROLS>
function decreaseVolume(){
    if(context.getVolume()>MIN_VOLUME){
        context.length--;
        context.width--;
        context.height--;
        context.reBuffer();
        reContainGas();
    }
    console.log("BRUH");


}
function increaseVoume(){
    if(context.getVolume()<MAX_VOLUME){
        context.length++;
        context.width++;
        context.height++;
        context.reBuffer();
    }
    
}
function increaseTemperature(){
    if(context.temperature < 500){
        context.temperature++;
        applyDeltaT(true);
    }
    
}
function decreaseTemperature(){
    if(context.temperature>0){
        context.temperature--;
        applyDeltaT(false);
    }
    if(context.temperature < 0){
        context.temperature=0;
    }
    
}
function _addParticles(){
    if(context.particleCount<MAX_PARTICLES-5){
        for(var i = 0 ; i < 5; i++){
            context.push(new Particle(rand(-context.xBound,context.xBound),rand(-context.yBound,context.yBound),rand(-context.zBound,context.zBound),context));
        }   
    }
}
function _clear(){
    //context.clear();
    

    //CONSTANT="NONE";
    //updateConstantStatus();
    window.location.reload();
}
function _release(){
    context.pop();
}

function handleButtons(){

    if(DVactive){
        decreaseVolume();
    }else if(IVactive){
        increaseVoume();
    }else if (DTactive){
        decreaseTemperature();
    }else if(ITactive){
        increaseTemperature();
    }else if (APactive){
        _addParticles();
    }else if (Cactive){
        _clear;
    }else if (RPactive){
        _release();
    }else{

    }


}

//constants
function enableAll(){

    document.getElementById("CNONE").disabled = false;
    document.getElementById("CTEMPERATURE").disabled = false;
    document.getElementById("CVOLUME").disabled = false;
    document.getElementById("CPRESSURE vs VOLUME").disabled = false;
    document.getElementById("CPRESSURE vs TEMPERATURE").disabled = false;


}

function updateConstantStatus(){
    enableAll();
    
    if(context.particleCount < 1){
        document.getElementById("CTEMPERATURE").className = "impossible";
        document.getElementById("CPRESSURE vs VOLUME").className = "impossible";
        document.getElementById("CPRESSURE vs TEMPERATURE").className = "impossible";
    }else{
        document.getElementById("CTEMPERATURE").className = "constant";
        document.getElementById("CPRESSURE vs VOLUME").className = "constant";
        document.getElementById("CPRESSURE vs TEMPERATURE").className = "constant";
    }

    document.getElementById("C"+CONSTANT).disabled = true;
    

    



}

function _setConstant(n){

    CONSTANT = n;
    
    updateConstantStatus();

}



//</USER CONTROLS>

//<Maintain Aspect>
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    width = window.innerWidth;
    height = window.innerHeight;
}
//</Maintain Aspect>






//<AMBIENT OBJECT>
var ambientObjectGeometry = new THREE.PlaneGeometry(9000,9000);
ambientObjectGeometry.rotateX(-Math.PI/2);
ambientObjectGeometry.translate(0,-52,0);
var ambientObjectMaterial = new THREE.MeshPhongMaterial({color: 0x110022});
var ambientObject = new THREE.Mesh(ambientObjectGeometry, ambientObjectMaterial);
ambientObject.recieveShadow=true;
scene.add(ambientObject);

//</AMBIENT OBJECT>

gridXZ = new THREE.GridHelper(500, 50,new THREE.Color(0xFF0000), new THREE.Color(0x007700));
gridXZ.position.y-=51;
scene.add(gridXZ);

//burstOfGas();
var animate = function () {
    requestAnimationFrame( animate );
    controls.update();
    updateConstantStatus();
    handleButtons();
    if(!PAUSED){
        context.update();
    }

    renderer.render( scene, camera );
    hud.render();
};



animate();
import {Canvas, contentView, device} from 'tabris';

class RotorGame {

  constructor() {
	this._hz = 60; // TODO: Calculate this based on device settings or event read rate.
	this._lastx = 0;
	this._lasty = 0;
    this._phi = Math.NaN;
    this._lastPhi = Math.NaN;
	this._deg360 = 0.0;
	this._circ_sec = 0.0;
	this._rotationSpeed = 0.0;
	this._heliHeight = 0.0;
    this._angV = 0.0;
    this._lastEventTime =0.0;
    this._fps = new FrequencyMonitor();
	this._rotor = new AnimatedImage();
	this._lastEventPos = undefined;

	this._cicleCount = 0;
  }
  
  resetCircleSpeed(){
	  this._circ_sec = 0.0;
  }
  
  draw(ctx, width, height) {
    this._ctx = ctx;
    this._width = width;
    this._height = height;
    this._ctx.font = '18px sans-serif';
    this._ctx.lineJoin = 'round';
    this._unit = this._width / 12;
    this._cx = Math.floor(this._width / 2);
    this._cy = Math.floor(this._height - this._unit*3);
    this._draw();
  }

  resetStats(){
	this._lastx = 0;
	this._lasty = 0;
    this._phi = Math.NaN;
    this._lastPhi = Math.NaN;
	this._deg360 = 0.0;
	this._circ_sec = 0.0;
    this._angV = 0.0;
	this._rotationSpeed = 0.0;
	this._heliHeight = 0.0;
	this._lastEventPos = undefined;
  }
  
  updateHeliRotationAndHeight(){
	if (this._circ_sec <= -this._rotationSpeed) // Only increase rotation speed on CCW motion
		this._rotationSpeed = this._rotationSpeed + 1.0/this._hz;
	else //if (this._circ_sec < this._rotationSpeed)
		this._rotationSpeed = this._rotationSpeed - 0.5/this._hz;
	
	if (this._rotationSpeed < 0.0)
		this._rotationSpeed = 0.0;

	this._rotor.setRateAsHz(this._rotationSpeed);

	if (this._rotationSpeed  >= 1.5)
		this._heliHeight = this._heliHeight + (0.002 * ((this._rotationSpeed-1.5)+1.0));
	else if (this._rotationSpeed  < 1.5 && this._heliHeight  > 0)
		this._heliHeight = this._heliHeight - (0.004 * ((1.5-this._rotationSpeed)+1.0));
	else
		this._heliHeight = 0.0;	
  }
  
  updateFromTouch(evt){
	this._lastEventTime = Date.now();
	this._lastEventPos = [evt.x, evt.y];
	this._phi = Math.atan2(evt.y-this._cy, evt.x-this._cx);
	this._deg360 = this._angleToDegrees(this._phi);
	if (this._lastPhi != Math.NaN){
		this._angV = this._phi - this._lastPhi;
		if (this._angV  > 5.0){
			this._angV = this._angV-2*Math.PI;
		}
		else if (this._angV < -5.0){
			this._angV = this._angV+2*Math.PI;
		}		
		this._circ_sec = this._deg360 - this._angleToDegrees(this._lastPhi);
		if (this._circ_sec < - 300)
			this._circ_sec = 360 + this._circ_sec;
		
		this._circ_sec = this._round(this._circ_sec * this._hz / 360.0, 2);	
	
		this.updateHeliRotationAndHeight();
	}	
	this._lastPhi = this._phi;	
	this._lastx = evt.x;
	this._lasty = evt.y;
  }
  
  _round(num, digits){
	return Number(num.toFixed(digits))
  }
  
  _angleToDegrees(phi){
	var angle =  phi * (180.0/Math.PI);
	if (angle < 0.0)
		angle = 180 + (180+angle);
	return angle;
  }
  
  _draw() {
	if ( Date.now() - this._lastEventTime >= 100){
		this._lastEventPos = undefined;
		this.resetCircleSpeed();
		this.updateHeliRotationAndHeight();
		this._lastEventTime = Date.now();
	}		

	this._rotor.setRise(this._heliHeight)
	  
    this._clear();
    this._drawCircle();
	if (this._lastEventPos)
		this._drawEventPos();
    this._drawStatsLabels();
    this._fps.update();	
	this._rotor.update(this._ctx, this._width, this._height);
    
	// re-schedule
	setTimeout(() => this._draw(), 0);
  }

  _clear() {
    this._ctx.clearRect(0, 0, this._width, this._height);
  }

  //_normalizeAngle(angle) {
  //  return angle > Math.PI * 2 ? angle - Math.PI * 2 : angle < 0 ? angle + Math.PI * 2 : angle;
  //}

  _drawCircle() {
    this._ctx.strokeStyle = '#0af';
    this._ctx.lineWidth = 2;
    this._ctx.beginPath();
    this._ctx.arc(this._cx, this._cy, this._unit*2, 0, 2 * Math.PI);
    this._ctx.stroke();
  }
  
  _drawEventPos(x, y){
    this._ctx.strokeStyle = '#003300';
    this._ctx.lineWidth = 1;
    this._ctx.beginPath();
    this._ctx.arc(this._lastEventPos[0],this._lastEventPos[1], this._unit/3, 0, 2 * Math.PI);
	this._ctx.fillStyle = 'red';
    this._ctx.fill();
    this._ctx.stroke();
  }

  _drawStatsLabels() {
    this._ctx.textAlign = 'left';
    this._ctx.textBaseline = 'top';
    this._ctx.fillStyle = '#000';
    this._ctx.lineWidth = 1;
    //this._ctx.fillText('FPS: ' + this._fps._updates.toFixed(1), 10, 10);
    //this._ctx.fillText('CPS: ' + this._cps._updates.toFixed(2), 10, 40);
	this._ctx.fillText('Velocity: ' +  this._angV.toFixed(2), 10, 10);
	this._ctx.fillText('Angle: ' +  this._deg360.toFixed(2), 10, 30);
	this._ctx.fillText('circ_sec: ' +  this._circ_sec.toFixed(2), 10, 50);
	this._ctx.fillText('Rotation Speed: ' +  this._rotationSpeed.toFixed(2), 10, 70);
	this._ctx.fillText('Heli Height: ' +  this._heliHeight.toFixed(2), 10, 90);
  }

}

class FrequencyMonitor {

  constructor() {
    this._start = 0;
    this._count = 0;
    this._updates = 0;
  }

  reset() {
    this._start = 0;
    this._count = 0;
    this._updates = 0;
  }
  
  update() {
    const now = Date.now();
    const time = now - this._start;
    this._count++;
    if (this._start === 0) {
      this._start = now;
    } else if (time >= 1000) {
      this._updates = this._count / (time / 1000);
      this._start = now;
      this._count = 0;
    }
  }
}

class AnimatedImage{

  constructor() {
	this._image = 0;
	this._atlas = 0;
	this.frame_number = 1;
	this._time = 0;
	this._last_time = 0;
    this._now = 0;
    this._rate = 50; // animation rate in msec
	this._rise = 0.0;
	this.setRateAsHz(0);
	
	this.loadRotorImages();
  }

  async loadRotorImages(){
	try{
		const img_response = await fetch('resources/myatlas-0.png');
		this._image = await createImageBitmap(await img_response.blob())
		//console.log('Loaded Image: resources/myatlas-0.png');
		const altas_response = await fetch('resources/myatlas.atlas');
		this._atlas =  await altas_response.json();
		this._atlas = this._atlas['myatlas-0.png'];
		//console.log('rotor_atlas:', this._atlas);
	}
	catch(err){
		console.log("Error:",err.message);	
	}
  }

  setRise(r){
	  this._rise = r;
  }
  
  setRateAsHz(hz){
	if (hz == 0)
		this._rate = 0.0;
	else
		this._rate = Math.round(1000.0/hz)/this.frameCount();
	if (this._rate >= 1000) // is rate (in msec) is really big, set it to 0 so no updates occur to animation.
		this._rate = 0.0;
  }
  
  frameCount(){
	return Object.keys(this._atlas).length;
  }
  
  update(ctx, gwidth, gheight) {
	if (this._image && this._atlas){
		var now = new Date().getTime();
		if(this._last_time == 0)
			this._last_time = now;
		this._time += (now - this._last_time);
		if (this._time > this._rate)
		{

			this._time -= this._rate;
			if (this._rate > 0.0)
				this.frame_number++;
			if (this.frame_number>this.frameCount())
				this.frame_number=1;
			this._last_time = now;
		}
		
		var fname = this.frame_number.toString();
		if (fname.length < 2)
			fname = '0'+fname;
		fname = 'rotor_'+fname;
		//console.log('fname:',fname);
		//console.log('image info: ',fname, this._atlas[fname]);
		var frame_pos = this._atlas[fname];
		var sprite_size = [frame_pos[2]/3, frame_pos[3]/3];
		var img_x = gwidth/2-sprite_size[0]/2;
		var img_y = 400 - (100 * this._rise);
		//if (imy_y < 0)
		//	imy_y = 0;
		//console.log('img: ',img_x, img_y, this._rise);
		ctx.drawImage(this._image, frame_pos[0], this._image.height-frame_pos[1], frame_pos[2], frame_pos[3], img_x, img_y, sprite_size[0], sprite_size[1]);
		}
  }
  
}


function printTouch(prefix, touches) {
  console.log(new Date().getTime() + ': ' + prefix + ' (' + touches.length + '): ', touches[0]);
}

function drawGameScreen({target: canvas, width, height}) {
  const scaleFactor = device.scaleFactor;
  const ctx = canvas.getContext('2d', width * scaleFactor, height * scaleFactor);
  // scale canvas to be pixel exact
  ctx.scale(scaleFactor, scaleFactor);
  game.draw(ctx, width, height);
}

// =========
//    Main
// =========

const game = new RotorGame();

contentView.append(
  <Canvas stretch onResize={drawGameScreen}/>
);

contentView
  .onTouchStart(({touches}) => {
	game.updateFromTouch(touches[0]);
	//printTouch('touchStart', touches);
	contentView.background = 'green';
  })
  .onTouchMove(({touches}) => {
	game.updateFromTouch(touches[0]);
	contentView.background = 'green';
	//printTouch('touchMove', touches);
  })
  .onTouchEnd(({touches}) => {
	//game.updateFromTouch(touches[0]);
	//game.resetStats();
	//printTouch('touchEnd', touches);
	contentView.background = 'yellow';
  })
  .onTouchCancel(({touches}) => {
	//game.updateFromTouch(touches[0]);
	game.resetStats();
	printTouch('touchCancel', touches);
	contentView.background = 'red';
  });
//  .onLongPress(({touches}) => {
//	contentView.background = 'blue';
//	printTouch('longPress',  touches);
//  });

/*
Ultraviolet
------------------------------------------------------------
Inspired by the album "Save Your Heart" by Lights and Motion
http://labs.nikrowell.com/lightsandmotion/ultraviolet
http://deepelmdigital.com/album/save-your-heart
*/

;(function(window) {

	var ctx,
		hue,
		buffer,
		target = {},
		tendrils = [],
		settings = {};

	settings.debug = false;
	settings.friction = 0.5;
	settings.trails = 30;
	settings.size = 40;
	settings.dampening = 0.4;
	settings.tension = 0.98;

	Math.TWO_PI = Math.PI * 2;

	// ========================================================================================
	// Oscillator
	// ----------------------------------------------------------------------------------------

	function Oscillator(options) {
		this.init(options || {});
	}

	Oscillator.prototype = (function() {

		var value = 0;

		return {

			init: function(options) {
				this.phase = options.phase || 0;
				this.offset = options.offset || 0;
				this.frequency = options.frequency || 0.001;
				this.amplitude = options.amplitude || 1;
			},

			update: function() {
				this.phase += this.frequency;
				value = this.offset + Math.sin(this.phase) * this.amplitude;
				return value;
			},

			value: function() {
				return value;
			}
		};

	})();

	// ========================================================================================
	// Tendril
	// ----------------------------------------------------------------------------------------

	function Tendril(options) {
		this.init(options || {});
	}

	Tendril.prototype = (function() {

		function Node() {
			this.x = 0;
			this.y = 0;
			this.vy = 0;
			this.vx = 0;
		}

		return {

			init: function(options) {

				this.spring = options.spring + (Math.random() * 0.1) - 0.05;
				this.friction = settings.friction + (Math.random() * 0.01) - 0.005;
				this.nodes = [];

				for(var i = 0, node; i < settings.size; i++) {

					node = new Node();
					node.x = target.x;
					node.y = target.y;

					this.nodes.push(node);
				}
			},

			update: function() {

				var spring = this.spring,
					node = this.nodes[0];

				node.vx += (target.x - node.x) * spring;
				node.vy += (target.y - node.y) * spring;

				for(var prev, i = 0, n = this.nodes.length; i < n; i++) {

					node = this.nodes[i];

					if(i > 0) {

						prev = this.nodes[i - 1];

						node.vx += (prev.x - node.x) * spring;
						node.vy += (prev.y - node.y) * spring;
						node.vx += prev.vx * settings.dampening;
						node.vy += prev.vy * settings.dampening;
					}

					node.vx *= this.friction;
					node.vy *= this.friction;
					node.x += node.vx;
					node.y += node.vy;

					spring *= settings.tension;
				}
			},

			draw: function() {

				var x = this.nodes[0].x,
					y = this.nodes[0].y,
					a, b;

				ctx.beginPath();
				ctx.moveTo(x, y);

				for(var i = 1, n = this.nodes.length - 2; i < n; i++) {

					a = this.nodes[i];
					b = this.nodes[i + 1];
					x = (a.x + b.x) * 0.5;
					y = (a.y + b.y) * 0.5;

					ctx.quadraticCurveTo(a.x, a.y, x, y);
				}

				a = this.nodes[i];
				b = this.nodes[i + 1];

				ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
				ctx.stroke();
				ctx.closePath();
			}
		};

	})();

	// ----------------------------------------------------------------------------------------

	function reset() {

		tendrils = [];

		for(var i = 0; i < settings.trails; i++) {

			tendrils.push(new Tendril({
				//spring: 0.45 + 0.025 * (i / settings.trails)
				spring: 0.6 + 0.001 * (i / settings.trails)
			}));
		}
	}

	function loop() {

		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = 'rgba(8,5,16,0.5)';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.globalCompositeOperation = 'lighter';
		//ctx.strokeStyle = 'hsla(' + Math.round(hue.update()) + ',90%,50%,0.1)';
		ctx.strokeStyle = 'hsla(' + Math.round(hue.update()) + ',96%,50%,'+opacityUpdate()+')';
		ctx.lineWidth = 2;

		for(var i = 0, tendril; i < settings.trails; i++) {
			tendril = tendrils[i];
			tendril.update();
			tendril.draw();
		}

		ctx.stats.update();
		requestAnimFrame(loop);
	}

	function opacityUpdate() {
		//con
		return Math.random() * (0.5 - 0.3) + 0.3;
	}

	function resize() {
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
	}

	function mousemove(event) {
		if(event.touches) {
			target.x = event.touches[0].pageX;
			target.y = event.touches[0].pageY;
		} else {
			target.x = event.clientX
			target.y = event.clientY;
		}
		//event.preventDefault();
	}

	function touchstart(event) {
		if(event.touches.length == 1) {
			target.x = event.touches[0].pageX;
			target.y = event.touches[0].pageY;
		}
	}

	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(fn) { window.setTimeout(fn, 1000 / 60) };
	})();

	window.onload = function() {

		ctx = document.getElementById('canvas').getContext('2d');
		ctx.stats = new Stats();

		hue = new Oscillator({
			phase: Math.random() * Math.TWO_PI,
			amplitude: 100,
			frequency: 100 * Math.random(),
			offset: 285
		});

		document.body.addEventListener('orientationchange', resize);
		window.addEventListener('resize', resize);

		document.addEventListener('mousemove', mousemove);
		document.addEventListener('touchmove', mousemove);
		document.addEventListener('touchstart', touchstart);

		target.x = Math.random() * ctx.canvas.width;
		target.y = Math.random() * ctx.canvas.height;

		resize();
		reset();
		loop();

		// kind of a hack ... but trigger a few mousemoves to kick things off

		mousemove({
			clientX: Math.random() * ctx.canvas.width,
			clientY: Math.random() * ctx.canvas.height
		});

		setTimeout(function() {
			mousemove({
				clientX: Math.random() * ctx.canvas.width,
				clientY: Math.random() * ctx.canvas.height
			});
		}, 100);

		setTimeout(function() {
			mousemove({
				clientX: Math.random() * ctx.canvas.width,
				clientY: Math.random() * ctx.canvas.height
			});
		}, 500);

		setTimeout(function() {
			mousemove({
				clientX: Math.random() * ctx.canvas.width,
				clientY: Math.random() * ctx.canvas.height
			});
		}, 1000);

		setTimeout(function() {
			mousemove({
				clientX: Math.random() * ctx.canvas.width,
				clientY: Math.random() * ctx.canvas.height
			});
		}, 2000);

		/*
		var gui = new dat.GUI();
		gui.add(settings, 'trails', 1, 30).onChange(reset);
		gui.add(settings, 'size', 25, 75).onFinishChange(reset);
		gui.add(settings, 'friction', 0.45, 0.55).onFinishChange(reset)
		gui.add(settings, 'dampening', 0.01, 0.4).onFinishChange(reset);
		gui.add(settings, 'tension', 0.95, 0.999).onFinishChange(reset);
		document.body.appendChild(ctx.stats.domElement);
		*/
	};

})(window);

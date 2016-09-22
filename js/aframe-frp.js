var dat = require("dat-gui");

var datGUI;

function findParentGUI(el) {
  // If the immeduate parent is a folder, use the folder.
  if (el.parentEl && 
    el.parentEl.components &&
    el.parentEl.components['selection-folder'] &&
    el.parentEl.components['selection-folder'].folder) {
    return el.parentEl.components['selection-folder'].folder
  } else {
    if (datGUI == undefined) {
       datGUI = new dat.GUI();       
    }
		return datGUI;
  }
}

AFRAME.registerComponent('selection-folder', {
   schema: {
     name: { type: 'string' }, // for some reason, missing out name messes the order
     open: { default: true, type: 'boolean' }
   },
   init: function () {
     var g = findParentGUI(this.el);
     var name = this.data.name;
     var count = 2;
     while(g.__folders[name] !== undefined) {
         name = this.data.name + " (" + count++ + ")"
     }

     this.folder = g.addFolder(name);

     if (this.data.open) {
       this.folder.open();
     }
   }
});

AFRAME.registerPrimitive('a-selection-folder',{
 defaultComponents: {
     "selection-folder": {}
   },
 mappings: {
   name:  'selection-folder.name',
   value: 'selection-folder.value'
 }
});

AFRAME.registerComponent('color-selector', {
   schema: {
     value: { default: '#1345FF', type: 'string' },
     name: { default: 'color', type: 'string' }
   },
   init: function () {
     var g = findParentGUI(this.el);
     var el = this.el;
     function change(value) {
       if (el.tagName == "A-COLOR-SELECTOR") { 
         el.setAttribute('value',value);
       } else {
         el.setAttribute('color-selector','value',value);
       }
     }
     this.controller = g.addColor(this.data, 'value').name(this.data.name).onChange(change);
     this.gui_data = this.data;
   },
   update: function() {
     this.gui_data.value = this.data.value;
     this.controller.updateDisplay();
   }
 });

AFRAME.registerPrimitive('a-color-selector',{
  defaultComponents: {
    "color-selector": {}
  },
  mappings: {
    name:  'color-selector.name',
    value: 'color-selector.value'
  }
});

AFRAME.registerComponent('number-selector', {
   schema: {
     value: { default: '0', type: 'number' },
     name: { default: 'number', type: 'string' },
     min: { default: null, type: 'number' },
     max: { default: null, type: 'number' },
     step: { default: null, type: 'number' }
   },
   init: function () {
     var g = findParentGUI(this.el);
     var el = this.el;

     this.controller = g.add(this.data, 'value');
   },
   update: function() {

     var that = this;
     this.controller = this.controller.name(this.data.name);
     ['min','max','step'].forEach(function(o) {
         if (that.data[o] != null) {
           that.controller = that.controller[o](that.data[o]);
         }
       });

     var el = this.el;
     var change = function(value) {
       if (el.tagName == "A-NUMBER-SELECTOR") { 
         el.setAttribute('value',value);
         el.setAttribute('type','number');
       } else {
         el.setAttribute('number-selector','value',value);
       }
     };

     this.controller.onChange(change);
   }
});

AFRAME.registerPrimitive('a-number-selector',{
  mappings: {
    value: 'number-selector.value',
    name: 'number-selector.name',
    min: 'number-selector.min',
    max: 'number-selector.max',
    step: 'number-selector.step'
  }
});


AFRAME.registerComponent('behavior', {
  schema: { default: "", type: 'string' },
  init: function () {
     this.now = Date.now();
  },
  tick: function(o) {
    var self = this;
    var target  = this.el.parentEl;
    var oldAttr = target.getAttribute(this.data.attribute);
    var env =
     { vec3: function(x,y,z) { return {x:x,y:y,z:z}; },
       id: function(o) { 
         var el = document.getElementById(o);
         var value = el.getAttribute("value");
         var type  = el.getAttribute("type");
         if (type == 'number') {
           return parseFloat(value);
         }
         return value;
       },
       now: Date.now() - self.now,
       mod: function(o) { return o % 1; },
       saw: function(o) { return Math.abs(((o + 1) % 2) - 1); },
       once: function(o) { return Math.min(1,o); },
       lerp: function(p0,p1,t) {
	 if (typeof p0 == "number") {
	     return ( p1 - p0 ) * t + p0;
	 } else if (p0.x && p0.y && p1.z) {
	     return { x: env.lerp(p0.x,p1.x,t),
		      y: env.lerp(p0.y,p1.y,t),
		      z: env.lerp(p0.z,p1.z,t) };
	 } else { // assume color
	     var c0 = new AFRAME.THREE.Color(p0);
	     var c1 = new AFRAME.THREE.Color(p1);
	     return "#" + c0.lerp(c1,t).getHexString();
	 }
       },
       Easing: AFRAME.TWEEN.Easing
     };

    var self = this;

    Object.keys(this.el.attributes).forEach(function (ix) {
       var name = self.el.attributes[ix].name;
         if (env[name] == undefined && self.el.hasAttribute(name)) {
           env[name] = self.el.getAttribute(name);
         }
    });

    var copy = AFRAME.utils.extendDeep({},env);
    try { 
      with (env) { 
        eval(this.data); 
      }
    } 
    catch(ex) {
        console.log(ex);
    }

    Object.keys(this.el.attributes).forEach(function (ix) {
        var name = self.el.attributes[ix].name;
        if (env[name] !== copy[name]) {
          self.el.setAttribute(name,env[name])
        }
      });
  }
});


let lineLength = 20 * Vars.tilesize;
let FOV = 20;
let spacing = Vars.tilesize / 2;

let player;
let enabled = false;


const LightSources = {
   flashlight: new LightSource("flashlight-"), lantern: new LightSource("lantern-"),
};
let lightIndex = 0;
let radii = [];

function LightSource(alias) {
   this.alias = alias;
   return {alias: this.alias};
};

function initFrag() {
   return {
      build(parent) {
         parent.fill(null, t => {
            t.right();
            let tab = t.table(Styles.none, t2 => {
               t2.defaults().padBottom(8);
               t2.button(Icon.refresh1, 30, () => {
              	lightIndex++;
                  lightIndex %= Object.keys(LightSources).length;
               }).size(60); 
               t2.row();
               
               let but = t2.button(new TextureRegionDrawable(Core.atlas.find("error")), 64, () => {
              	enabled = !enabled;
                  Sounds.click.play(1);
               }).size(80).get();
 
               but.update(() => {
                  let k = Object.keys(LightSources);
                  let name = LightSources[k[lightIndex].toString()].alias;
                  let icon = Core.atlas.find(Vars.renderer.lights.enabled() ? (enabled ? "lighting-" + name + "enabled" : "lighting-" + name + "disabled") : "lighting-" + name + "broken");
                  but.getStyle().imageUp = new TextureRegionDrawable(icon);
               });
               
               t2.row();
               t2.add("Toggle").style(Styles.defaultLabel);
            }).marginRight(8).get();
            
            tab.visibility = () => {
               let menuBlock = Reflect.get(Vars.ui.hudfrag.blockfrag, "menuHoverBlock");
           	if (Vars.control.input.block != null || menuBlock != null || Vars.ui.hudfrag.blockfrag.hover() != null) return false;
               return true;
            };	
         });
      }
   };
};

function Ray(unit, angle) {
   let len;
   if (!unit.isFlying()) { //do not block the rays coming from flying units
      World.raycast(tile(unit.x), tile(unit.y), tile(unit.x + Angles.trnsx(angle, lineLength)), tile(unit.y + Angles.trnsy(angle, lineLength)), (tx, ty) => {
         let t = Vars.world.tile(tx, ty);
         if (t != null && t.solid()) {
        	len = unit.dst(t); //TODO no tile snapping?
        	return true;
         }
         len = lineLength;
         return false;
     });
   }
   else len = lineLength;
   return len;
};

function tile(number) {
   return World.toTile(number);
};

function checkLights() {
   return (enabled && Vars.renderer.lights.enabled());
};

function drawRays() {
   let angle = player.rotation;
   for (let i = 0; i < FOV; i++) {
      let angleThing = angle - (FOV * (spacing / 2)) / 2 + i * (spacing / 2);
      let r = Ray(player, angleThing);
      Drawf.light(
         player.x, player.y,
         player.x + Angles.trnsx(angleThing, r),
         player.y + Angles.trnsy(angleThing, r),
         spacing, player.type.lightColor, player.type.lightOpacity
      );
   }
};

function drawCircular() {
   for (let pair of radii) {
      if (pair[1] == player.type) {
         Drawf.light(player.x, player.y, pair[0], player.type.lightColor, player.type.lightOpacity);
      }
   }
};

Events.on(ClientLoadEvent, () => {
   Vars.content.units().each(u => {
      radii.push([u.lightRadius, u]);
      u.lightRadius = 0;
   });
   
   //experimental fog of war rendering
   Vars.content.units().each(u => {
   	let prev = u.constructor.get();
   	u.constructor = () => extend(prev.getClass(), {
   	    inFogTo(team) {
   	       if (this == player) return false;
   
   	       //totally avant stuff here
       	   let temp = Angles.angle(player.x, player.y, this.x, this.y);
              let tempDst = Mathf.dst(player.x, player.y, this.x, this.y);
              if (Vars.renderer.lights.enabled()) {
                 if (this.team != team) {
                    if (enabled && tempDst <= lineLength && Angles.within(player.rotation, temp, (FOV * spacing + 0.75) / 2)) {
                   	return false;
    	            }
                 }
                 else return false;
                 return true;
              }
              return false;
   	    },
       });
   });
  
   Vars.ui.settings.addCategory("Mindustry Lighting", Icon.units, tb => {
      tb.sliderPref("(Flashlight) Field Of View", 20, 1, 35, 1, res => {
     	FOV = parseInt(res);

     	return res;
      });

      tb.sliderPref("(Flashlight) Line Length", 20, 1, 35, 1, res => {
     	lineLength = parseInt(res) * Vars.tilesize;

     	return res;
      });
   });
   
   const toggleFrag = initFrag();
   toggleFrag.build(Vars.ui.hudGroup);
});

Events.run(Trigger.draw, () => {
   //only light when there is lighting, the player toggles a light source, and the player isn't a building
   if (Vars.state.isMenu() || !checkLights() || player instanceof BlockUnitc) return;
   
   let current = Object.keys(LightSources)[lightIndex].toString();
   if (current == "flashlight") {
      drawRays();
   }
   else drawCircular();
});

Events.run(Trigger.update, () => player = Vars.player.unit());
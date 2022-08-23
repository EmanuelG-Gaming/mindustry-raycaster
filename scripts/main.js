let lineLength = 20 * Vars.tilesize;
let FOV = 20;
let spacing = Vars.tilesize / 2;

let enabled = false;

function initFrag() {
   return {
      build(parent) {
         parent.fill(null, t => {
            t.right();
            t.table(Styles.none, t2 => {
               let but = t2.button(new TextureRegionDrawable(Core.atlas.find("error")), 64, () => {
              	enabled = !enabled;
                  Sounds.click.play(1);
               }).size(80).get();
            
               but.update(() => {
              	let icon = Core.atlas.find((enabled ? "raycaster-flashlight-enabled" : "raycaster-flashlight-disabled"));
                  but.getStyle().imageUp = new TextureRegionDrawable(icon);
               });
               
               t2.row();
               t2.add("Toggle").style(Styles.defaultLabel).padBottom(8);
            }).marginRight(8);
         });
      }
   };
};

function Ray(unit, angle) {
   let len;
   World.raycast(tile(unit.x), tile(unit.y), tile(unit.x + Angles.trnsx(angle, lineLength)), tile(unit.y + Angles.trnsy(angle, lineLength)), (tx, ty) => {
      let tile = Vars.world.tile(tx, ty); //tile to check
      if (tile != null && tile.solid()) {
      	len = unit.dst(tile);
      	return true;
      }
      len = lineLength;
      return false;
   });
   return len;
};

function tile(number) {
   return World.toTile(number);
};

function drawRays() {
   let plr = Vars.player.unit();
   let angle = plr.rotation;
   
   for (let i = 0; i < FOV; i++) {
      let angleThing = angle - (FOV * (spacing / 2)) / 2 + i * (spacing / 2);
      let r = Ray(plr, angleThing);
      Drawf.light(
         plr.x, plr.y,
         plr.x + Angles.trnsx(angleThing, r),
         plr.y + Angles.trnsy(angleThing, r),
         spacing, plr.type.lightColor, plr.type.lightOpacity
      );
   }
};

Events.on(ClientLoadEvent, () => {
   //no need for circular lanterns here
   Vars.content.units().each(u => u.lightRadius = 0);
   
   Vars.ui.settings.addCategory("Mindustry Raycaster", Icon.units, tb => {
      tb.sliderPref("Field Of View", 20, 1, 35, 1, res => {
      	FOV = parseInt(res);

      	return res;
      });

      tb.sliderPref("Line Length", 20, 1, 35, 1, res => {
      	lineLength = parseInt(res) * Vars.tilesize;

      	return res;
      });
   });
   
   const toggleFrag = initFrag();
   toggleFrag.build(Vars.ui.hudGroup);
});

Events.run(Trigger.draw, () => {
   //only light when there is lighting
   if ((Vars.state.isMenu() && !Renderer.lights.enabled()) || !enabled) return;
  
   drawRays();
});
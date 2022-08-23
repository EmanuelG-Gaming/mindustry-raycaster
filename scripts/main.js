let lineLength = 20 * Vars.tilesize;
let FOV = 20;
let spacing = Vars.tilesize / 2;

function Ray(unit, angle) {
   let len;
   Vars.world.raycastEachWorld(unit.x, unit.y, unit.x + Angles.trnsx(angle, lineLength), unit.y + Angles.trnsy(angle, lineLength), (tx, ty) => {
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
});

Events.run(Trigger.draw, () => {
   //only toggle when there is lighting
   if (Vars.state.isMenu() && !Renderer.lights.enabled()) return;
   let plr = Vars.player.unit();
   
   let angle = plr.rotation;
   for (let i = 0; i < FOV; i++) {
      let angleThing = angle - (FOV * (spacing / 2)) / 2 + i * (spacing / 2);
      let len = Ray(plr, angleThing);
      Drawf.light(
         plr.x, plr.y,
         plr.x + Angles.trnsx(angleThing, len),
         plr.y + Angles.trnsy(angleThing, len),
         spacing, plr.type.lightColor, plr.type.lightOpacity
      );
   }
});

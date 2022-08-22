let lineLength = 12 * Vars.tilesize;
let FOV = 16;
let spacing = Vars.tilesize / 2;

function fl(number) {
   return Mathf.floor(number);
};

function Ray(unit, angle) {
   let len;
   Vars.world.raycastEachWorld(fl(unit.x), fl(unit.y), fl(unit.x + Angles.trnsx(angle, lineLength)), fl(unit.y + Angles.trnsy(angle, lineLength)), (tx, ty) => {
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
         spacing, Pal.accent, 0.5
      );
   }
});

var checkDelay=30;
function withinRange(pos1,pos2,size){
	if(pos1.x-size<pos2.x & pos1.x+size>pos2.x){
		if(pos1.y-size<pos2.y & pos1.y+size>pos2.y){
			if(pos1.z-size<pos2.z & pos1.z+size>pos2.z){
				return true;
			}
		}
	}
	return false;
}
function stackMobs(server,entity,radius){
	if(entity!==null & entity!==undefined){
		if(server!==null & server!==undefined){
			if((entity.animal || entity.monster  || entity.ambientCreature || entity.waterCreature) & entity.getNBTData("noStack").isNull() & entity.alive){
				var entities=server.getEntities("@e[type="+entity.type+"]");
				var tempMob;
				if(entity.getNBTData("count").isNull()){
					var count=1;
				}else{
					var count=entity.getNBTData("count").asInt();
				}
				for(var mobNumber=0;mobNumber<entities.length;mobNumber++){
					tempMob=entities[mobNumber];
					if(tempMob.alive & (tempMob.animal || tempMob.monster || tempMob.ambientCreature  || entity.waterCreature)){
						if(entity.id!=tempMob.id){
							if(withinRange(entity,tempMob,radius)& entity.getNBTData("noStack").isNull()){
								if(tempMob.getNBTData("count").isNull()){
									count+=1;
									tempMob.kill();
								}else{
									count+=tempMob.getNBTData("count").asInt();
									tempMob.kill();
								}
							}
						}
					}
				}
				entity.setNBTData("count",count);
				entity.setCustomName(entity.type + " x"+count);
			}
		}
	}
}
function stackAllMobs(server){
	if(server===undefined || server===null){
		var serverEvent=utils.server;
	}else{
		var serverEvent=server;
	}
	if(serverEvent!==undefined & serverEvent !==null){
		var ents=serverEvent.getEntities("@e");
		for(var i=0;i<ents.length;i++){
			if(!ents[i].item & !ents[i].player & ents[i].alive){
				stackMobs(serverEvent,ents[i],10);
			}
		}
	}
}
events.listen("entity.death",function(event){
	if(!event.entity.getNBTData("count").isNull()){
		var count=event.entity.getNBTData("count").asInt();
		if(count>1 & !event.source.type.equals("outOfWorld")){
			var anim=event.world.createEntity(event.entity.type);
			anim.setPositionAndRotation(event.entity.x,event.entity.y,event.entity.z,event.entity.yaw,event.entity.pitch);
			event.entity.setNBTData("count",count-1);
			event.entity.setCustomName(event.entity.type + " x"+count);
			var fullNbt=event.entity.fullNBT.copy;
			fullNbt.remove("UUIDMost");
			fullNbt.remove("UUIDLeast");
			anim.fullNBT=fullNbt;
			anim.setNBTData("count",count-1);
			anim.health=event.entity.fullNBT.get("Attributes").asList().get(0).asCompound().get("Base").asDouble();
			event.entity.setNBTData("noStack",1);
			anim.spawn();
		}
	}
});
events.listen("entity.spawned",function(event){
	if(event.entity.getNBTData("noStack").isNull()){
		stackMobs(event.server,event.entity,5);
	}
});
events.listen("entity.drops",function(event){
	if(event.entity.animal || event.entity.monster  || event.entity.ambientCreature || event.entity.waterCreature){
		if(event.source.type.equals("outOfWorld") & event.entity.getNBTData("noStack").isNull()){
			event.cancel();
		}
	}
});
events.listen("server.load",function(event){
	event.server.schedule(1000*checkDelay,event.server,function(callback){
		stackAllMobs(callback.data);
		callback.reschedule();
	});
});
// This file has been modified from the original PF2e toolbox module.
const settingsKey = "pf2e-flatten";

function registerSettings() {
	game.settings.register(settingsKey, "autoflatten", {
		name: "pf2e-flatten.settings.autoflatten.name",
		hint: "pf2e-flatten.settings.autoflatten.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
}),
game.settings.register(settingsKey, "halflevel", {
	name: "pf2e-flatten.settings.halflevel.name",
	hint: "pf2e-flatten.settings.halflevel.hint",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register(settingsKey, "version", {
	name: "version",
	scope: "world",
	config: false,
	type: Number,
	default: 0.12
})
};


Hooks.once("init", () => {
	registerSettings();
});

Hooks.once("ready", () => {
if (game.settings.get("pf2e-flatten", "version") === 0.12){
	ui.notifications.info(`Applying Migration to NPC flattening. Please be patient and do not close your game or shut down your server.`, {permanent: !0});
	upgradeActors();
};
});

async function upgradeActors() {
	for (const actor of game.actors.entities) {
		if (actor.data.type === "npc"){
		if (actor.data.data.customModifiers['all'] !== undefined){
     await upgradeActorsInner(actor)
		};
 };
};
	game.settings.set("pf2e-flatten", "version", 0.13), ui.notifications.info(`PF2E-Flatten Migration to version 0.13 completed!`, {
		permanent: !0
	})
};

async function upgradeActorsInner (actor) {
	const modifierName = 'Flattened Proficiency';
	for(var i=0, len= actor.data.data.customModifiers['all'].length; i<len; i++){
		if(actor.data.data.customModifiers['all'][i].name === modifierName){
		  await upgradeFlags(actor, modifierName);
		};
	};
	return 1;
}

async function upgradeFlags (actor, modifierName){
	await actor.removeCustomModifier('all', modifierName);
	await actor.setFlag("pf2e-flatten", "flattened", {value: true});
	await actor.setFlag("pf2e-flatten", "flattenvalue", {value: actor.data.data.details.level.value});
	return 1;
}




Hooks.on('getActorDirectoryEntryContext', onFlattenProficiencyContextHook);
Hooks.on('createActor', AutoFlattenNPC );

function AutoFlattenNPC(li){
		var dontflatten = 0;
    const modifierName = 'Flattened Proficiency';
		if(game.settings.get(settingsKey, "autoflatten") === true){
      const id = li.data._id;
      const actor = game.actors.get(id);
			if(actor.data.type === 'npc'){
       if(actor.data.data.attributes.ac.value > 0 && actor.data.type === 'npc'){
 				if (actor.getFlag("pf2e-flatten", "flattened") !== undefined){
					if (actor.getFlag("pf2e-flatten", "flattened").value === true){
						var dontflatten = 1
					};
				};

				if (actor.data.data.customModifiers !== undefined){
				if (actor.data.data.customModifiers['all'] !== undefined){
					for(var i=0, len= actor.data.data.customModifiers['all'].length; i<len; i++){
						if(actor.data.data.customModifiers['all'][i].name === modifierName){
							actor.removeCustomModifier('all', modifierName);
							actor.setFlag("pf2e-flatten", "flattened", {value: true});
							actor.setFlag("pf2e-flatten", "flattenvalue", {value: actor.data.data.details.level.value});
						};
					};
				};
			};

			if (dontflatten !== 1){
			 if(game.settings.get(settingsKey, "halflevel") === true){
				var level = Math.floor(parseInt(actor.data.data.details.level.value)/2)
			 } else {
			  var level = parseInt(actor.data.data.details.level.value)
		   };

			if(level < 0) {level = 0};
			actor.setFlag("pf2e-flatten", "flattened", {value: true});
			actor.setFlag("pf2e-flatten", "flattenvalue", {value: level});

      const ac = parseInt(actor.data.data.attributes.ac.base);
      const newac = ac - level;
      actor.update ({ "data.attributes.ac.base": newac});

      const perc1 = parseInt(actor.data.data.attributes.perception.base);
      const newperc = perc1 - level;
      actor.update ({ "data.attributes.perception.base": newperc});

      const fort1 = parseInt(actor.data.data.saves.fortitude.base);
      const newfort = fort1 - level;
      actor.update ({ "data.saves.fortitude.base": newfort});

      const reflex1 = parseInt(actor.data.data.saves.reflex.base);
      const newreflex = reflex1 - level;
      actor.update ({ "data.saves.reflex.base": newreflex});

      const will1 = parseInt(actor.data.data.saves.will.base);
      const newwill = will1 - level;
      actor.update ({ "data.saves.will.base": newwill});

      let itemUpdates = [];
      for (let i = 0; i < actor.data['items'].length; i++) {
          const item = actor.data['items'][i];
          if (item.type === 'melee') {
              const oldAttack = parseInt(item.data.bonus.value);
              const newAttack = oldAttack - level;
              const attackUpdate = {
                  _id: item._id,
                  ['data.bonus.value']: newAttack,
                  ['data.bonus.total']: newAttack,
              };
              itemUpdates.push(attackUpdate);

          } else if (item.type === 'spellcastingEntry') {
            const spellDC1 = parseInt(item.data.spelldc.dc);
              if (void 0 !== spellDC1) {
                const newspelldc = spellDC1 - level;
                const spellAttack1 = parseInt(item.data.spelldc.value);
                const newspellattack = spellAttack1 - level;
          const spellUpdate = {
              _id: item._id,
              ['data.spelldc.dc']: newspelldc,
              ['data.spelldc.value']: newspellattack,
          };
          itemUpdates.push(spellUpdate);
          }
        }
      else if (item.type === 'lore') {
            const oldValue = parseInt(item.data.mod.value);
            const newValue = oldValue - level;
            itemUpdates.push({
                _id: item._id,
                ['data.mod.value']: newValue,
            });
        }
      }
      actor.updateEmbeddedEntity('OwnedItem', itemUpdates);
  };
 };
};
};
}

function onFlattenProficiencyContextHook(html, buttons) {
    const modifierName = 'Flattened Proficiency';
    const hasModifier = (actor) => {
		const currentflag = actor.getFlag("pf2e-flatten", "flattened")

				if (currentflag !== undefined){
					if (currentflag.value === true){
            return true;
        	};
			 	};
        return false;
    };

    buttons.unshift({
        name: 'PF2e Flatten NPC',
        icon: '<i class="fas fa-level-down-alt"></i>',
        condition: (li) => {
            const id = li.data('entity-id');
            const actor = game.actors.get(id);
            return actor.data.type === 'npc' && !hasModifier(actor);
        },
        callback: async (li) => {
            const id = li.data('entity-id');
            const actor = game.actors.get(id);
            //actor.removeCustomModifier('all', modifierName);
						if(game.settings.get(settingsKey, "halflevel") === true){
							var level = Math.floor(parseInt(actor.data.data.details.level.value)/2)
						 } else {
						  var level = parseInt(actor.data.data.details.level.value)
					   };
						if(level < 0) {level = 0};
            //actor.addCustomModifier('all', modifierName, 0, 'untyped');
						actor.setFlag("pf2e-flatten", "flattened", {value: true});
						actor.setFlag("pf2e-flatten", "flattenvalue", {value: level});

            const ac = parseInt(actor.data.data.attributes.ac.base);
            const newac = ac - level;
            await actor.update ({ "data.attributes.ac.base": newac});

            const perc1 = parseInt(actor.data.data.attributes.perception.base);
            const newperc = perc1 - level;
            await actor.update ({ "data.attributes.perception.base": newperc});

            const fort1 = parseInt(actor.data.data.saves.fortitude.base);
            const newfort = fort1 - level;
            await actor.update ({ "data.saves.fortitude.base": newfort});

            const reflex1 = parseInt(actor.data.data.saves.reflex.base);
            const newreflex = reflex1 - level;
            await actor.update ({ "data.saves.reflex.base": newreflex});

            const will1 = parseInt(actor.data.data.saves.will.base);
            const newwill = will1 - level;
            await actor.update ({ "data.saves.will.base": newwill});

            let itemUpdates = [];
            for (let i = 0; i < actor.data['items'].length; i++) {
                const item = actor.data['items'][i];
                if (item.type === 'melee') {
                    const oldAttack = parseInt(item.data.bonus.value);
                    const newAttack = oldAttack - level;
                    const attackUpdate = {
                        _id: item._id,
                        ['data.bonus.value']: newAttack,
                        ['data.bonus.total']: newAttack,
                    };
                    itemUpdates.push(attackUpdate);

                } else if (item.type === 'spellcastingEntry') {
                  const spellDC1 = parseInt(item.data.spelldc.dc);
                    if (void 0 !== spellDC1) {
                      const newspelldc = spellDC1 - level;
                      const spellAttack1 = parseInt(item.data.spelldc.value);
                      const newspellattack = spellAttack1 - level;
                const spellUpdate = {
                    _id: item._id,
                    ['data.spelldc.dc']: newspelldc,
                    ['data.spelldc.value']: newspellattack,
                };
                itemUpdates.push(spellUpdate);
                }
              }
            else if (item.type === 'lore') {
                  const oldValue = parseInt(item.data.mod.value);
                  const newValue = oldValue - level;
                  itemUpdates.push({
                      _id: item._id,
                      ['data.mod.value']: newValue,
                  });
              }
            }
            await actor.updateEmbeddedEntity('OwnedItem', itemUpdates);
        },
    });
    buttons.unshift({
        name: 'PF2e Unflatten NPC',
        icon: '<i class="fas fa-level-up-alt"></i>',
        condition: (li) => {
            const id = li.data('entity-id');
            const actor = game.actors.get(id);
            return actor.data.type === 'npc' && hasModifier(actor);
        },
        callback: async (li) => {
            const id = li.data('entity-id');
            const actor = game.actors.get(id);
						var level = actor.getFlag("pf2e-flatten", "flattenvalue").value
						if(level < 0) {level = 0};
						actor.setFlag("pf2e-flatten", "flattened", {value: false});
						actor.setFlag("pf2e-flatten", "flattenvalue", {value: level});


            const ac = parseInt(actor.data.data.attributes.ac.base);
            const newac = ac + level;
            await actor.update ({ "data.attributes.ac.base": newac});

            const perc1 = parseInt(actor.data.data.attributes.perception.base);
            const newperc = perc1 + level;
            await actor.update ({ "data.attributes.perception.base": newperc});

            const fort1 = parseInt(actor.data.data.saves.fortitude.base);
            const newfort = fort1 + level;
            await actor.update ({ "data.saves.fortitude.base": newfort});

            const reflex1 = parseInt(actor.data.data.saves.reflex.base);
            const newreflex = reflex1 + level;
            await actor.update ({ "data.saves.reflex.base": newreflex});

            const will1 = parseInt(actor.data.data.saves.will.base);
            const newwill = will1 + level;
            await actor.update ({ "data.saves.will.base": newwill});

            let itemUpdates = [];
            for (let i = 0; i < actor.data['items'].length; i++) {
                const item = actor.data['items'][i];
                if (item.type === 'melee') {
                    const oldAttack = parseInt(item.data.bonus.value);
                    const newAttack = oldAttack + level;
                    const attackUpdate = {
                        _id: item._id,
                        ['data.bonus.value']: newAttack,
                        ['data.bonus.total']: newAttack,
                    };
                    itemUpdates.push(attackUpdate);

                } else if (item.type === 'spellcastingEntry') {
                  const spellDC1 = parseInt(item.data.spelldc.dc);
                    if (void 0 !== spellDC1) {
                      const newspelldc = spellDC1 + level;
                      const spellAttack1 = parseInt(item.data.spelldc.value);
                      const newspellattack = spellAttack1 + level;
                const spellUpdate = {
                    _id: item._id,
                    ['data.spelldc.dc']: newspelldc,
                    ['data.spelldc.value']: newspellattack,
                };
                itemUpdates.push(spellUpdate);
                }
              } else if (item.type === 'lore') {
                    const oldValue = parseInt(item.data.mod.value);
                    const newValue = oldValue + level;
                    const skillUpdate = {
                        _id: item._id,
                        ['data.mod.value']: newValue,
                    };
                itemUpdates.push(skillUpdate);
                }
            }
            await actor.updateEmbeddedEntity('OwnedItem', itemUpdates);
        },
    });
}

// This file has been modified from the original PF2e toolbox module.
const settingsKey = "pf2e-flatten";

function registerSettings() {
	game.settings.register(settingsKey, "autoflatten", {
		name: "pf2e-flatten.settings.autoflatten.name",
		hint: "pf2e-flatten.settings.autoflatten.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
})
};


Hooks.once("init", () => {
registerSettings()
});

Hooks.on('getActorDirectoryEntryContext', onFlattenProficiencyContextHook);
Hooks.on('createActor', AutoFlattenNPC );

function AutoFlattenNPC(li){
			var dontflatten = 0;
      const modifierName = 'Flattened Proficiency';
		if(game.settings.get(settingsKey, "autoflatten") === true){
      const id = li.data._id;
      const actor = game.actors.get(id);
      if(actor.data.data.attributes.ac.value > 0 && actor.data.type === 'npc'){ //&& !(actor.data.data.customModifiers['all'].name.includes(modifierName))
					window.VEL = actor.data.data.customModifiers['all'];
				if(typeof actor.data.data.customModifiers['all'] !== 'undefined'){
				for(var i=0, len= actor.data.data.customModifiers['all'].length; i<len; i++){
					if(actor.data.data.customModifiers['all'][i].name === modifierName){
						var dontflatten = 1
					};
				};
			};

			if (dontflatten !== 1){
			var level = parseInt(actor.data.data.details.level.value);
			if(level < 0) {level = 0};
      actor.addCustomModifier('all', modifierName, 0, 'untyped');

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
}

function onFlattenProficiencyContextHook(html, buttons) {
    const modifierName = 'Flattened Proficiency';
    const hasModifier = (actor) => {
        const data = actor.data.data;
        if (data.customModifiers && data.customModifiers.all) {
            const all = data.customModifiers.all;
            for (const modifier of all) {
                if (modifier.name === modifierName) {
                    return true;
                }
            }
        }
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
						var level = parseInt(actor.data.data.details.level.value);
						if(level < 0) {level = 0};
            actor.addCustomModifier('all', modifierName, 0, 'untyped');

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
						var level = parseInt(actor.data.data.details.level.value);
						if(level < 0) {level = 0};
            actor.removeCustomModifier('all', modifierName);

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

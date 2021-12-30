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
})
};


Hooks.once("init", () => {
	registerSettings();
});

Hooks.on('createActor', AutoFlattenNPC );
Hooks.on('getActorDirectoryEntryContext', onFlattenProficiencyContextHook);

async function AutoFlattenNPC(li){
 if(game.settings.get(settingsKey, "autoflatten") === true){
	 	const modifierName = game.settings.get(settingsKey, "halflevel") ? '1/2 Level Proficiency' :'Proficiency Without Level';
    const id = li.data._id;
    const actor = game.actors.get(id);
    if(actor.data.type === 'npc'){
			const level = game.settings.get(settingsKey, "halflevel") ? Math.max(Math.floor(parseInt(actor?.data.data['details'].level.value)/2), 0) : Math.max(parseInt(actor?.data.data['details'].level.value),0);
			await actor.addCustomModifier('all', modifierName, -level, 'untyped');
    }
 }
}

async function onFlattenProficiencyContextHook(html, buttons) {
const modifierName = game.settings.get(settingsKey, "halflevel") ? '1/2 Level Proficiency' :'Proficiency Without Level';
const modifierUnSlug = game.settings.get(settingsKey, "halflevel") ? 'proficiency-without-level': '1/2-level-proficiency' ;
const modifierSlug = game.settings.get(settingsKey, "halflevel") ? '1/2-level-proficiency' : 'proficiency-without-level'
const hasModifier = (actor) => {
		const data = actor.data.data;
		if (data.customModifiers && data.customModifiers.all) {
				const all = data.customModifiers.all;
				for (const modifier of all) {
						if (modifier.label === modifierName) {
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
						const id = li.data('document-id');
						const actor = game.actors.get(id);
						return actor?.data.type === 'npc' && !hasModifier(actor);
				},
				callback: async (li) => {
						const id = li.data('document-id');
						const actor = game.actors.get(id);
						const level = game.settings.get(settingsKey, "halflevel") ? Math.max(Math.floor(parseInt(actor?.data.data['details'].level.value)/2), 0) : Math.max(parseInt(actor?.data.data['details'].level.value),0);
						await actor.addCustomModifier('all', modifierName, -level, 'untyped');
						await actor.removeCustomModifier('all', modifierUnName);
					}
		});
		buttons.unshift({
				name: 'PF2e Unflatten NPC',
				icon: '<i class="fas fa-level-up-alt"></i>',
				condition: (li) => {
						const id = li.data('document-id');
						const actor = game.actors.get(id);
						return actor?.data.type === 'npc' && hasModifier(actor);
				},
				callback: async (li) => {
						const id = li.data('document-id');
						const actor = game.actors.get(id);
						await actor.removeCustomModifier('all', modifierSlug);
				},
		});
		}

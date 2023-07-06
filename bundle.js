// This file has been modified from the original PF2e toolbox module.
const settingsKey = "pf2e-flatten";
const pf2eFlattenModifierName = 'Proficiency Without Level';

const wordCharacter = String.raw`[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacter = String.raw`[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacterRE = new RegExp(nonWordCharacter, "gu")
	, nonWordBoundary = String.raw`(?:${wordCharacter})(?=${wordCharacter})`
	, lowerCaseLetter = String.raw`\p{Lowercase_Letter}`
	, upperCaseLetter = String.raw`\p{Uppercase_Letter}`
	, lowerCaseThenUpperCaseRE = new RegExp(`(${lowerCaseLetter})(${upperCaseLetter}${nonWordBoundary})`, "gu");

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
	game.settings.register(settingsKey, "halflevelPC", {
		name: "pf2e-flatten.settings.halflevelPC.name",
		hint: "pf2e-flatten.settings.halflevelPC.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	})
};


Hooks.once("init", () => {
	registerSettings();
});

Hooks.on('createActor', AutoFlattenNPC);
Hooks.on('getActorDirectoryEntryContext', onFlattenProficiencyContextHook);

async function AutoFlattenNPC(li) {
	if (game.settings.get(settingsKey, "autoflatten") === true) {
		const id = li._id;
		const actor = game.actors.get(id);
		if (actor.type === 'npc') {
			const level = game.settings.get(settingsKey, "halflevel") ? Math.max(Math.floor(parseInt(actor?.system['details'].level.value) / 2), 0) : Math.max(parseInt(actor?.system['details'].level.value), 0);
			await actor.addCustomModifier('all', pf2eFlattenModifierName, -level, 'untyped');
		}
		if (actor.type === 'character' && game.settings.get(settingsKey, "halflevelPC")) {
			const level = Math.max(Math.floor(parseInt(actor?.system['details'].level.value) / 2), 0);
			await actor.addCustomModifier('all', pf2eFlattenModifierName, -level, 'untyped');
		}
	}
}

async function onFlattenProficiencyContextHook(html, buttons) {
	const hasModifier = (actor) => {
		const data = actor.system;
		if (data.customModifiers && data.customModifiers.all) {
			const all = data.customModifiers.all;
			for (const modifier of all) {
				if (modifier.label === pf2eFlattenModifierName) {
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
			if (game.settings.get(settingsKey, "halflevelPC")) {
				return !hasModifier(actor);
			}
			else {
				return actor?.data.type === 'npc' && !hasModifier(actor);
			}
		},
		callback: async (li) => {
			const id = li.data('document-id');
			const actor = game.actors.get(id);
			const level = game.settings.get(settingsKey, "halflevel") ? Math.max(Math.floor(parseInt(actor?.system['details'].level.value) / 2), 0) : Math.max(parseInt(actor?.system['details'].level.value), 0);
			await actor.addCustomModifier('all', pf2eFlattenModifierName, -level, 'untyped');
		}
	});
	buttons.unshift({
		name: 'PF2e Unflatten NPC',
		icon: '<i class="fas fa-level-up-alt"></i>',
		condition: (li) => {
			const id = li.data('document-id');
			const actor = game.actors.get(id);
			if (game.settings.get(settingsKey, "halflevelPC")) {
				return hasModifier(actor);
			}
			else {
				return actor?.data.type === 'npc' && hasModifier(actor);
			}
		},
		callback: async (li) => {
			const id = li.data('document-id');
			const actor = game.actors.get(id);
			const slug = pf2eFlattenModifierName.replace(lowerCaseThenUpperCaseRE, "$1-$2").toLowerCase().replace(/['’]/g, "").replace(nonWordCharacterRE, " ").trim().replace(/[-\s]+/g, "-")
			await actor.removeCustomModifier('all', slug);
		},
	});
}
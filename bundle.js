// This file has been modified from the original PF2e toolbox module.
const settingsKey = "pf2e-flatten";
const pf2eModifierName = 'Flattened Level Proficiency';

const wordCharacter = String.raw`[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacter = String.raw`[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacterRE = new RegExp(nonWordCharacter, "gu")
	, nonWordBoundary = String.raw`(?:${wordCharacter})(?=${wordCharacter})`
	, lowerCaseLetter = String.raw`\p{Lowercase_Letter}`
	, upperCaseLetter = String.raw`\p{Uppercase_Letter}`
	, lowerCaseThenUpperCaseRE = new RegExp(`(${lowerCaseLetter})(${upperCaseLetter}${nonWordBoundary})`, "gu");

const RoundingModes = {
	CEIL: {
		ordinal: 0,
		func: Math.ceil
	},
	FLOOR: {
		ordinal: 1,
		func: Math.floor
	}
}
RoundingModes.properties = {
	0: "CEIL",
	1: "FLOOR"
}
RoundingModes.enumFromValue = function (ordinal) {
	return RoundingModes.properties[ordinal];
}

const Multipliers = {
	HALF: 0.5,
	NONE: 1
}

Hooks.once("init", () => {
	game.settings.register(settingsKey, "enabled", {
		name: `${settingsKey}.settings.enabled.name`,
		hint: `${settingsKey}.settings.enabled.hint`,
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	});
	game.settings.register(settingsKey, "autoflatten", {
		name: `${settingsKey}.settings.autoflatten.name`,
		hint: `${settingsKey}.settings.autoflatten.hint`,
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	});
	game.settings.register(settingsKey, "multiplier", {
		name: `${settingsKey}.settings.multiplier.name`,
		hint: `${settingsKey}.settings.multiplier.hint`,
		scope: "world",
		config: true,
		type: Number,
		default: Multipliers.HALF,
		choices: {
			[Multipliers.HALF]: game.i18n.localize(`${settingsKey}.settings.multiplier.half`),
			[Multipliers.NONE]: game.i18n.localize(`${settingsKey}.settings.multiplier.none`),
		}
	});
	game.settings.register(settingsKey, "roundingMode", {
		name: `${settingsKey}.settings.roundingMode.name`,
		hint: `${settingsKey}.settings.roundingMode.hint`,
		scope: "world",
		config: true,
		type: Number,
		default: RoundingModes.CEIL.ordinal,
		choices: {
			[RoundingModes.CEIL.ordinal]: game.i18n.localize(`${settingsKey}.settings.roundingMode.ceil`),
			[RoundingModes.FLOOR.ordinal]: game.i18n.localize(`${settingsKey}.settings.roundingMode.floor`),
		}
	});
});

Hooks.on('renderActorDirectory', async (cc, [html], opts) => {
	if (!moduleEnabled()) {
		return;
	}
	if (!game.user.isGM) {
		return;
	}

	const buttons = html.querySelector('header .action-buttons');

	const flattenButton = document.createElement('button');
	const unflattenButton = document.createElement('button');

	if (game.release.generation >= 11) {
		flattenButton.classList.add('ic-wide')
		unflattenButton.classList.add('ic-wide')
	}

	flattenButton.classList.add('flatten-actors');
	flattenButton.type = 'button';
	flattenButton.innerHTML = `<i class="fa-solid fa-level-down-alt"></i> Flatten All`;

	unflattenButton.classList.add('flatten-actors');
	unflattenButton.type = 'button';
	unflattenButton.innerHTML = `<i class="fa-solid fa-level-up-alt"></i> Unflatten All`;

	buttons.append(flattenButton);
	buttons.append(unflattenButton);

	flattenButton.addEventListener('click', async (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		let actors = Array.from(
			document.querySelector('#actors').querySelectorAll('.actor'),
			li => {
				let actorId = $(li).data('document-id')
				return game.actors.get(actorId);
			})
			.filter(actor => isUpdatable(actor) && !hasModifier(actor))
		ui.notifications.info(`Flattening ${actors.length} actors`);
		for (let a of actors) {
			await flattenActor(a);
		}
		ui.notifications.info(`Finished flattening ${actors.length} actors`);
	});

	unflattenButton.addEventListener('click', async (ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		let actors = Array.from(
			document.querySelector('#actors').querySelectorAll('.actor'),
			li => {
				let actorId = $(li).data('document-id')
				return game.actors.get(actorId);
			})
			.filter(actor => isUpdatable(actor) && hasModifier(actor));
		ui.notifications.info(`Un-flattening ${actors.length} actors`);
		for (let a of actors) {
			await unflattenActor(a);
		}
		ui.notifications.info(`Finished un-flattening ${actors.length} actors`);
	});
});

Hooks.on('createActor', async (actor) => {
	if (!moduleEnabled()) {
		return;
	}
	if (isUpdatable(actor) && game.settings.get(settingsKey, "autoflatten") === true) {
		await flattenActor(actor);
	}
});

Hooks.on('updateActor', async (actor) => {
	if (!moduleEnabled()) {
		return;
	}
	if (isUpdatable(actor) && hasModifier(actor) && getFlatteningValue(actor) !== computeFlatteningValue(actor)) {
		await unflattenActor(actor);
		await flattenActor(actor);
		ui.notifications.info(`Re applied flattening for actor ${actor?.name} (${actor?.id})`)
	}
});

Hooks.on('getActorDirectoryEntryContext', async (html, entryOptions) => {
	if (!moduleEnabled()) {
		return;
	}
	entryOptions.unshift({
		name: 'PF2e Flatten NPC',
		icon: '<i class="fas fa-level-down-alt"></i>',
		condition: ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			return moduleEnabled() && isUpdatable(actor) && !hasModifier(actor);
		},
		callback: async ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			await flattenActor(actor);
		}
	});
	entryOptions.unshift({
		name: 'PF2e Unflatten NPC',
		icon: '<i class="fas fa-level-up-alt"></i>',
		condition: ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			return moduleEnabled() && isUpdatable(actor) && hasModifier(actor);
		},
		callback: async ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			await unflattenActor(actor);
		},
	});
});

function moduleEnabled() {
	return game.settings.get(settingsKey, "enabled");
}

function isUpdatable(actor) {
	return actor.type === 'character' || actor.type === 'npc';
}

function hasModifier(actor) {
	const data = actor.system;
	if (data.customModifiers && data.customModifiers.all) {
		const all = data.customModifiers.all;
		for (const modifier of all) {
			if (modifier.label === pf2eModifierName) {
				return true;
			}
		}
	}
	return false;
};

function getFlatteningValue(actor) {
	const data = actor.system;
	if (data.customModifiers && data.customModifiers.all) {
		const all = data.customModifiers.all;
		for (const modifier of all) {
			if (modifier.label === pf2eModifierName) {
				return modifier.modifier;
			}
		}
	}
	return undefined;
};

async function flattenActor(actor) {
	const modifierValue = computeFlatteningValue(actor);
	await actor.addCustomModifier('all', pf2eModifierName, modifierValue, 'untyped');
}

async function unflattenActor(actor) {
	const slug = pf2eModifierName.replace(lowerCaseThenUpperCaseRE, "$1-$2").toLowerCase().replace(/['’]/g, "").replace(nonWordCharacterRE, " ").trim().replace(/[-\s]+/g, "-")
	await actor.removeCustomModifier('all', slug);
}

function computeFlatteningValue(actor) {
	const multiplier = game.settings.get(settingsKey, "multiplier");
	const roundingMode = RoundingModes[RoundingModes.enumFromValue(game.settings.get(settingsKey, "roundingMode"))]
	return -1 * Math.max(roundingMode.func(parseInt(actor?.system['details'].level.value * multiplier), 0));
}

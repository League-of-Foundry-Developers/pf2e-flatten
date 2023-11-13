// This file has been modified from the original PF2e toolbox module.
const settingsKey = "pf2e-flatten";
const pf2eFlattenModifierName = 'Proficiency Without Level';
const pf2eHalfFlattenModifierName = 'Half Level Proficiency';

const wordCharacter = String.raw`[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacter = String.raw`[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`
	, nonWordCharacterRE = new RegExp(nonWordCharacter, "gu")
	, nonWordBoundary = String.raw`(?:${wordCharacter})(?=${wordCharacter})`
	, lowerCaseLetter = String.raw`\p{Lowercase_Letter}`
	, upperCaseLetter = String.raw`\p{Uppercase_Letter}`
	, lowerCaseThenUpperCaseRE = new RegExp(`(${lowerCaseLetter})(${upperCaseLetter}${nonWordBoundary})`, "gu");

Hooks.once("init", () => {
	game.settings.register(settingsKey, "autoflatten", {
		name: "pf2e-flatten.settings.autoflatten.name",
		hint: "pf2e-flatten.settings.autoflatten.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	});
	game.settings.register(settingsKey, "halflevel", {
		name: "pf2e-flatten.settings.halflevel.name",
		hint: "pf2e-flatten.settings.halflevel.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	});
	game.settings.register(settingsKey, "halflevelPC", {
		name: "pf2e-flatten.settings.halflevelPC.name",
		hint: "pf2e-flatten.settings.halflevelPC.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
	});
});

Hooks.on('renderActorDirectory', async (cc, [html], opts) => {
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
			.filter(actor => canFlatten(actor))
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
			.filter(actor => canUnflatten(actor));
		ui.notifications.info(`Un-flattening ${actors.length} actors`);
		for (let a of actors) {
			await unflattenActor(a);
		}
		ui.notifications.info(`Finished un-flattening ${actors.length} actors`);
	});
});

Hooks.on('createActor', async (actor) => {
	if (game.settings.get(settingsKey, "autoflatten") === true) {
		await flattenActor(actor);
	}
});

Hooks.on('updateActor', async (actor) => {
	if (hasModifier(actor) && getFlatteningValue(actor) !== computeFlatteningValue(actor)) {
		await unflattenActor(actor);
		await flattenActor(actor);
		ui.notifications.info(`Re applied flattening for actor ${actor?.name} (${actor?.id})`)
	}
});

Hooks.on('getActorDirectoryEntryContext', async (html, entryOptions) => {
	entryOptions.unshift({
		name: 'PF2e Flatten NPC',
		icon: '<i class="fas fa-level-down-alt"></i>',
		condition: ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			return canFlatten(actor);
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
			return canUnflatten(actor);
		},
		callback: async ($li) => {
			const id = $li.data('document-id');
			const actor = game.actors.get(id);
			await unflattenActor(actor);
		},
	});
});

function canFlatten(actor) {
	if (game.settings.get(settingsKey, "halflevelPC")) {
		return !hasModifier(actor);
	}
	else {
		return actor?.data.type === 'npc' && !hasModifier(actor);
	}
}

function canUnflatten(actor) {
	if (game.settings.get(settingsKey, "halflevelPC")) {
		return hasModifier(actor);
	}
	else {
		return actor?.data.type === 'npc' && hasModifier(actor);
	}
}

function hasModifier(actor) {
	const data = actor.system;
	if (data.customModifiers && data.customModifiers.all) {
		const all = data.customModifiers.all;
		for (const modifier of all) {
			if (modifier.label === pf2eFlattenModifierName || modifier.label === pf2eHalfFlattenModifierName) {
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
			if (modifier.label === pf2eFlattenModifierName || modifier.label === pf2eHalfFlattenModifierName) {
				return modifier.modifier;
			}
		}
	}
	return undefined;
};

async function flattenActor(actor) {
	const halfLevel = game.settings.get(settingsKey, "halflevel");
	const modifierName = halfLevel ? pf2eHalfFlattenModifierName : pf2eFlattenModifierName;
	const modifierValue = computeFlatteningValue(actor);
	await actor.addCustomModifier('all', modifierName, modifierValue, 'untyped');
}

async function unflattenActor(actor) {
	const halfLevel = game.settings.get(settingsKey, "halflevel");
	const modifierName = halfLevel ? pf2eHalfFlattenModifierName : pf2eFlattenModifierName;
	const slug = modifierName.replace(lowerCaseThenUpperCaseRE, "$1-$2").toLowerCase().replace(/['’]/g, "").replace(nonWordCharacterRE, " ").trim().replace(/[-\s]+/g, "-")
	await actor.removeCustomModifier('all', slug);
}

function computeFlatteningValue(actor) {
	const halfLevel = game.settings.get(settingsKey, "halflevel");
	if (actor.type === 'npc') {
		return -1 * (halfLevel ? Math.max(Math.ceil(parseInt(actor?.system['details'].level.value) / 2), 0) : Math.max(parseInt(actor?.system['details'].level.value), 0));
	}
	if (actor.type === 'character' && game.settings.get(settingsKey, "halflevelPC")) {
		return -1 * (Math.max(Math.ceil(parseInt(actor?.system['details'].level.value) / 2), 0));
	}
	return -1 * (halfLevel ? Math.max(Math.ceil(parseInt(actor?.system['details'].level.value) / 2), 0) : Math.max(parseInt(actor?.system['details'].level.value), 0));
}

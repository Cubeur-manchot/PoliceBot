"use strict";

import Discord from "discord.js";

export default class DiscordComponentMessageBuilder {
	static componentTypes = {
		user: "User",
		button: "Button"
	};
	constructor(textContent, components) {
		this.textContent = textContent;
		this.components = components.map(component => new Discord.ActionRowBuilder().addComponents(this.buildComponent(component)));
	};
	buildComponent = component => {
		switch (component.type) {
			case DiscordComponentMessageBuilder.componentTypes.user: return this.buildUserSelectComponent(component.members, component.customId);
			case DiscordComponentMessageBuilder.componentTypes.button: return this.buildButtonComponent(component.label, component.customId);
			default: throw new Error(`Unrecognized component type "${component.type}"`);
		};
	};
	buildUserSelectComponent = (memberIds, customId) =>
		new Discord.UserSelectMenuBuilder()
			.setCustomId(`${customId}-usersSelect`)
			.setPlaceholder("Sélectionner les utilisateurs")
			.setMinValues(1)
			.setMaxValues(20)
			.setDefaultUsers(memberIds);
	buildButtonComponent = (label, customId) =>
		new Discord.ButtonBuilder()
			.setCustomId(`${customId}-validateButton`)
			.setLabel(label)
			.setStyle(Discord.ButtonStyle.Primary);
};

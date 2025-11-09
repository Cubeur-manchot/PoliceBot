"use strict";

import Discord from "discord.js";

export default class DiscordMessageBuilder {
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
			case DiscordMessageBuilder.componentTypes.user: return this.buildUserSelectComponent(component.members);
			case DiscordMessageBuilder.componentTypes.button: return this.buildButtonComponent(component.label);
			default: throw "Unrecognized component type";
		};
	};
	buildUserSelectComponent = memberIds =>
		new Discord.UserSelectMenuBuilder()
			.setCustomId("selectedUsers")
			.setPlaceholder("Sélectionner les utilisateurs")
			.setMinValues(1)
			.setMaxValues(20)
			.setDefaultUsers(memberIds);
	buildButtonComponent = label =>
		new Discord.ButtonBuilder()
			.setCustomId("validateButton")
			.setLabel(label)
			.setStyle(Discord.ButtonStyle.Primary);
};

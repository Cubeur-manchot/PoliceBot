"use strict";

import Discord from "discord.js";

export default class DiscordEmbedMessageBuilder {
	static colors = {
		helpMessage: "#a8a8a8",
		infraction: "#cccc00",
		prison: "#e7b306",
		warn: "#e78a10",
		ban: "#fc0000",
		message: "#550055",
		user: "#3a05b4",
		invite: "#03b194"
	};
	constructor(embedOptions) {
		let embed = new Discord.EmbedBuilder();
		if (embedOptions.color) {
			embed.setColor(embedOptions.color);
		} else {
			throw new Error("Missing embed color");
		}
		if (embedOptions.title) {
			embed.setTitle(this.truncateString(embedOptions.title));
		} else {
			throw new Error("Missing embed title");
		}
		if (embedOptions.url) {
			embed.setURL(embedOptions.url);
		}
		if (embedOptions.author) { // {name, iconURL, url}
			embed.setAuthor({
				...embedOptions.author,
				name: this.truncateString(embedOptions.author.name)
			});
		}
		if (embedOptions.thumbnailUrl) {
			embed.setThumbnail(embedOptions.thumbnailUrl);
		}
		if (embedOptions.description) {
			embed.setDescription(this.truncateString(embedOptions.description, 4096));
		}
		if (embedOptions.fields) { // [{name, value, inline}]
			embed.addFields(
				embedOptions.fields
					.slice(0, 25)
					.map(field => ({
						name: this.truncateString(field.name),
						value: this.truncateString(field.value, 1024),
						inline: field.inline ?? false
					}))
			);
		}
		if (embedOptions.imageUrl) {
			embed.setImage(embedOptions.imageUrl);
		}
		if (embedOptions.footer) { // {text, iconURL}
			embed.setFooter({
				...embedOptions.footer,
				text: this.truncateString(embedOptions.footer.text, 2048)
			});
		}
		embed.setTimestamp(new Date());
		this.embed = embed;
	};
	truncateString = (text, maxLength = 256) => text?.length > maxLength ? text.substring(0, maxLength - 1) + "…" : text;
};

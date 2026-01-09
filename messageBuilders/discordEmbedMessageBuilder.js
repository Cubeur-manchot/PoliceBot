"use strict";

import Discord from "discord.js";

export default class DiscordEmbedMessageBuilder {
	static colors = {
		helpMessage: "#a8a8a8",
		infraction: "#cccc00",
		prison: "#e7b306",
		warning: "#e78a10",
		ban: "#fc0000",
		message: "#550055",
		user: "#3a05b4",
		invite: "#03b194"
	};
	constructor(embedOptions) {
		let {color, title, url, author, thumbnailUrl, description, fields, imageUrl, footer} = embedOptions;
		let embed = new Discord.EmbedBuilder();
		if (color) {
			embed.setColor(color);
		} else {
			throw new Error("Missing embed color");
		}
		if (title) {
			embed.setTitle(this.truncateString(title));
		} else {
			throw new Error("Missing embed title");
		}
		if (url) {
			embed.setURL(url);
		}
		if (author) { // {name, iconURL, url}
			embed.setAuthor({
				...author,
				name: this.truncateString(author.name)
			});
		}
		if (thumbnailUrl) {
			embed.setThumbnail(thumbnailUrl);
		}
		if (description) {
			embed.setDescription(this.truncateString(description, 4096));
		}
		if (fields) { // [{name, value, inline}]
			embed.addFields(
				fields
					.slice(0, 25)
					.map(field => ({
						name: this.truncateString(field.name),
						value: this.truncateString(field.value, 1024),
						inline: field.inline ?? false
					}))
			);
		}
		if (imageUrl) {
			embed.setImage(imageUrl);
		}
		if (footer) { // {text, iconURL}
			embed.setFooter({
				...footer,
				text: this.truncateString(footer.text, 2048)
			});
		}
		embed.setTimestamp(new Date());
		this.embed = embed;
	};
	truncateString = (text, maxLength = 256) => text?.length > maxLength ? text.substring(0, maxLength - 1) + "…" : text;
};

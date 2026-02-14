"use strict";

import CommandHandler from "./commandHandler.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";

export default class HelpCommandHandler extends CommandHandler {
    constructor(commandManager) {
        super(
            commandManager,
            "help",
            {
                slash: true,
                user: false,
                message: false
            },
            "Décris les commandes et les détections"
        );
    };
    handleApplicationCommand = async interaction => {
        let commandsEmbed = new DiscordEmbedMessageBuilder({
            color: DiscordEmbedMessageBuilder.colors.helpMessage,
            title: "Commandes",
            description: [
                `PoliceBot met à disposition plusieurs commandes, utilisables uniquement par les <@&${process.env.MODERATOR_ROLE_ID}>.`,
                "Le mode d'utilisation est propre à chaque commande, soit en slash command, soit en sélectionnant un membre, soit en sélectionnant un message, soit plusieurs de ces contextes.",
                "La liste exhaustive est présentée ci-dessous."
            ].join(" "),
            fields: this.commandManager.commands.map(command => ({
                name: command.name,
                value: [
                    `${command.description}.`,
                    `Contextes : ${Object.keys(command.contexts).filter(context => command.contexts[context]).map(context => context.replace("user", "membre")).join(", ")}.`
                ].join("\n")
            }))
        });
        let detectionsEmbed = new DiscordEmbedMessageBuilder({
            color: DiscordEmbedMessageBuilder.colors.helpMessage,
            title: "Détections",
            description: [
                "PoliceBot surveille les messages qui sont envoyés ou modifiés, et vérifie qu'il ne contient :",
				"- Aucune expression interdite",
				"- Aucune invitation vers un serveur qui n'est pas whitelisté (un serveur peut être rajouté à la whitelist à l'aide de la commande `whitelist`)",
				"Lorsqu'un message ne respecte pas une ou plusieurs de ces règles :",
                "- Le message original sera supprimé",
                "- Une infraction sera enregistrée pour l'auteur du message",
                "- Un message privé sera envoyé à l'utilisateur pour lui indiquer la raison de la suppression du message",
				`Ces règles ne sont pas appliquées aux messages des <@&${process.env.MODERATOR_ROLE_ID}>.`
            ].join("\n"),
        });
        return [commandsEmbed, detectionsEmbed];
    };
};

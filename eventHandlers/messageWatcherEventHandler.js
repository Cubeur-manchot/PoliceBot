"use strict";

import {AttachmentBuilder} from 'discord.js';
import {ZipArchive} from 'archiver';
import EventHandler from "./eventHandler.js";

export default class MessageWatcherEventHandler extends EventHandler {
	constructor(eventManager, event) {
		super(eventManager, event);
	};
	prepareAttachmentsForLog = async attachments => {
		let totalSize = attachments.reduce((cumulativeSize, attachment) => cumulativeSize + attachment.size, 0);
		if (totalSize <= process.env.ATTACHMENT_SIZE_LIMIT_BYTES) { // all attachments are under the size limit, no need to compress
			return attachments;
		}
		this.logger.info(`The "${attachments.length}" attachments reach a total of "${totalSize}" bytes which exceeds "${process.env.ATTACHMENT_SIZE_LIMIT_BYTES}" bytes, so they will be compressed.`)
		let zipArchiver = new ZipArchive({ zlib: { level: 9 } });
		let chunks = [];
		let archiving = new Promise((resolve, reject) => {
			zipArchiver.on('data', chunk => chunks.push(chunk));
			zipArchiver.on('end', () => resolve(Buffer.concat(chunks)));
			zipArchiver.on('error', reject);
		});
		for (let attachment of attachments) {
			this.logger.debug(`Boucle sur attachment ${attachment.id}, attachments.length = ${attachments.length}`);
			let response = await fetch(attachment.url);
			if (!response.ok) {
				this.logger.error(`Failed to download attachment ${attachment.name ?? attachment.id} (HTTP ${response.status})`);
				return [];
			}
			let fileBuffer = Buffer.from(await response.arrayBuffer());
			let fileName = attachment.name ?? `fichier_${attachment.id}`;
			zipArchiver.append(fileBuffer, { name: fileName });
		}
		zipArchiver.finalize();
		let zipBuffer = await archiving;
		this.logger.info(`Finished archiving "${attachments.length}" attachments into a final archive of "${zipBuffer.length}" bytes.`);
		if (zipBuffer.length > process.env.ATTACHMENT_SIZE_LIMIT_BYTES) {
			this.logger.warn(`The compressed attachments archive is still too large (${zipBuffer.length} bytes) to be sent to Discord, so it will be skipped.`);
			return [];
		}
		let zipAttachment = new AttachmentBuilder(zipBuffer, {name: "attachments.zip"});
		return [zipAttachment];
	};
};

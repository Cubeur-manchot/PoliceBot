"use strict";

import EventHandler from "./eventHandler.js";

export default class TickEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, "tick");
	};
	handleEvent = async () => {
	};
};

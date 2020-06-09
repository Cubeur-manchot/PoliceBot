"use strict";

const badWords = [
	"b(i|1)tt?e",
	"teub",
	"ch(i|1)bre",
	"(c|k)ou(i|1)ll?e",
	"(e|a)n(c|k)ul",
	"(c|k)(o|0)nn?a(r|ss?e)",
	"p(é|e)tass?e",
	"putt?(e|a?(i|1))",
	"sal(o|0)p",
	"br(a|e)nll?(é|e)"
];

const badWordsRegex = new RegExp("^.*(" + badWords.join("|") + ").*$", "gi");

module.exports = {badWords, badWordsRegex};

"use strict";

const badWords = [
	"b(i|1)tt?es?",
	"teube?s?",
	"ch(i|1)bre?s?",
	"(c|k)ou(i|1)ll?es?",
	"(e|a)n(c|k)ul(é|e)s?",
	"(c|k)(o|0)nn?a(rd?|ss?e)s?",
	"p(é|e)tass?es?",
	"putt?(e|ain|1)s?",
	"sal(o|0)pe?s?",
	"br(a|e)nll?(é?e)s?"
];

const badWordsRegex = new RegExp("(^| |	)" + badWords.join("|") + "( |	|$)", "gi");

module.exports = {badWords, badWordsRegex};

"use strict";

const dictionnize = (array, property) => Object.fromEntries(array.map(element => [element[property], element]));

export default dictionnize;

const rogscript = require("./rogscript.js");

const repeatRegex = /^(\d+)#/;

function parseLine(input="", attributes, variables) {
  let results = [];
  let dice = 0;
  attributes = attributes ?? new Map();
  variables = variables ?? new Map();
  const repeatExp = input.match(repeatRegex) ?? ["", 1];

  input = input.slice(repeatExp[0].length).trim();
  let repeat = parseInt(repeatExp[1], 10);
  repeat = Math.min(100, Math.max(repeat, 1));

  for (let i=0; i<repeat; i++) {
    let currentResult = rogscript.parse(input, { attributes, variables });
    dice += currentResult.dice;
    attributes = currentResult.attributes;
    variables = currentResult.variables;
    results.push(currentResult);
  }

  return {
    results,
    attributes,
    variables,
    dice
  };
}

function parseBlock(input, attributes) {
  let results = [];
  let dice = 0;
  attributes = attributes ?? new Map();
  variables = new Map();

  for (let line of input.split(/[\n\r]+/)) {
    line = line.trim();
    let currentLine = parseLine(line, attributes, variables);
    dice += currentLine.dice;
    attributes = currentLine.attributes;
    variables = currentLine.variables;
    results.push(...currentLine.results);
  }

  return {
    results,
    attributes,
    variables,
    dice
  };
}

module.exports = {
  parseBlock,
  parseLine
}
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
    if (dice >= 1000) {
      throw Error("Número de dados por linha excedeu o limite de 1000.");
    }
    let currentResult = rogscript.parse(input, { attributes, variables });
    dice      += currentResult.dice;
    attributes = currentResult.attributes;
    variables  = currentResult.variables;
    results.push(currentResult);
  }

  return {
    results,
    attributes,
    variables,
    dice,
    lineCount: repeat
  };
}

function parseBlock(input, attributes) {
  let results = [];
  let dice = 0;
  let lineCount = 0;
  attributes = attributes ?? new Map();
  variables = new Map();

  for (let line of input.trim().split(/[\n\r]+/)) {
    if (lineCount >= 100) {
      throw Error("Número de linhas excedeu o limite de 100.");
    }
    line = line.trim();
    let currentLine = parseLine(line, attributes, variables);
    lineCount += currentLine.lineCount;
    dice      += currentLine.dice;
    attributes = currentLine.attributes;
    variables  = currentLine.variables;
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
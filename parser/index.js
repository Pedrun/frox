const fs = require("fs");
const file = fs.readFileSync("./example.txt").toString();

const roglang = require("./roglang_v2.js");

console.log(file, "\n\n");
console.log(roglang.parse(file));

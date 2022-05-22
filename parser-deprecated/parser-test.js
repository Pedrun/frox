const peggyFile = "roglang-v2"; 

const { exec } = require("child_process");
const Rog = require("../rog.js");
let parser = null;
exec(`peggy ${peggyFile}.peggy`, (err, stdout, stderr) => {
  if (err)
    console.log(err);
  if (stderr)
    console.log(stderr);
  if (stdout)
    console.log(stdout);
  
  console.log("Parsing done.");
  parser = require(`./${peggyFile}.js`);
});
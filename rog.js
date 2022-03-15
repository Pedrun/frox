const { Collection } = require("@discordjs/collection");

function toJSON() {
  let json = {};
  for (let key in this) {
    let val = this[key];

    if (val instanceof Map) {
      json[key] = Array.from(val);
      continue;
    }

    json[key] = val;
  }

  return json;
}

class Instance {
  constructor({users=[], settings={}}) {
    this.users = new Collection(users).mapValues(v => 0);
    this.settings = new InstanceSettings(settings);
  }
}
Instance.prototype.toJSON = toJSON;

class InstanceSettings {

}
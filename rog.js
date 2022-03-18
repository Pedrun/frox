const { Collection } = require("@discordjs/collection");
const { normalizeStr } = require("./util");

function toJSON() {
  let json = {};
  for (let [key, val] in Object.entries(this)) {
    if (val instanceof Map) {
      json[key] = Array.from(val);
      continue;
    }

    json[key] = val;
  }

  return json;
}

const possibleAttr = /^[A-Z_]{1,32}$/;

class Instance {
  constructor({
    id="",
    users=[],
    settings={},
    skills=[]
  }) {
    this.id = id;
    this.users = new Collection(users)
      .mapValues(v => new Player(v));

    this.settings = new InstanceSettings(settings);

    this.skills = new Collection(skills);
  }

  get guild() {
    return "AAAAAAAAAAA";
  }

  createUser(userId) {
    const newUser = new Player({
      id:userId
    });
    this.users.set(userId, newUser);
    return newUser;
  }
  hasUser(userId) {
    return this.users.has(userId);
  }
  getUser(userId) {
    return this.users.get(userId);
  }
}
Instance.prototype.toJSON = toJSON;

class InstanceSettings {
  constructor({
    hideCard=false
  }) {
    this.hideCard = hideCard;
  }
}

class Player {
  constructor({
    id="",
    nameSuffix="",
    cardIndex=0,
    cards=[]
  }) {
    this.id = id;
    this.nameSuffix = nameSuffix;

    this.cardIndex = cardIndex;
    this.cards = cards.map(c => new Card(c));
  }

  // Nickname-suffix-related methods
  async updateSuffix(member) {
    const username = member.displayName;

    let newTag = this.nameSuffix.replace(/\{([A-Z_]+)\}/g, (match, attr) => {
      if (this.hasAttr(attr)) {
        return this.getAttr(attr);
      }
      return match;
    });
    if (newTag.length < 1) return this;

    let newUsername = username.replace(/\[.*?\]/, `[${newTag}]`);
    console.log(newUsername);
    member.setNickname(newUsername);
  }


  // Card-related methods
  get card() {
    return this.cards[this.cardIndex];
  }
  

  // Attribute-related methods
  hasAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    return this.card.attributes.has(cleanAttr);
  }
  getAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    if (this.hasAttr(cleanAttr)) {
      return this.card.attributes.get(cleanAttr);
    } else {
      return null;
    }
  }
  setAttr(attr, value) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    let val = Math.floor(Number(value));
    if (this.hasAttr(cleanAttr)) {
      this.card.attributes.set(cleanAttr, val);
    } else {
      throw new ReferenceError(`"${cleanAttr}" is not a defined attribute`);
    }
    return this;
  }
}

class Card {
  constructor({
    name="",
    attributes=[]
  }) {
    this.name = name;
    this.attributes = new Collection(attributes);
  }
}
Card.prototype.toJSON = toJSON;



// Export
const Rog = {
  client:{},
  Instance,
  InstanceSettings,
  Player,
  Card
}
module.exports = Rog;
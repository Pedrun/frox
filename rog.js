const { Collection } = require("@discordjs/collection");
const { normalizeStr } = require("./util");

function toJSON() {
  let json = {};
  for (let [key, val] of Object.entries(this)) {
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
      .mapValues(v => new Player({...v, guildId:this.id}));

    this.settings = new InstanceSettings(settings);
    this.skills = new Collection(skills);
  }

  get guild() {
    return Rog.client.guilds.fetch(this.id);
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
    listChannel="",
    DMrole=""
  }) {
    this.listChannel = listChannel;
    this.DMrole = DMrole;
  }
}

class Player {
  constructor({
    id="",
    guildId="",
    nameSuffix="",
    suffixSeparator="[",
    cardIndex=0,
    cards=[]
  }) {
    this.id = id;
    this.guildId = guildId;
    this.nameSuffix = nameSuffix;
    this.suffixSeparator = suffixSeparator;

    this.cardIndex = cardIndex;
    this.cards = cards.map(c => new Card(c));
  }

  // Nickname-suffix-related methods
  async updateSuffix() {
    if (this.nameSuffix.length < 1) return;

    const guild = await this.instance.guild;
    if (!guild) return;

    const member = await guild.members.fetch(this.id);
    if (!member) return;

    let username = member.displayName;
    username = username.split(this.suffixSeparator)[0];

    let newTag = this.nameSuffix.replace(/\{([A-Z_]+)\}/g, (match, attr) => {
      if (this.card.hasAttr(attr)) {
        return this.card.getAttr(attr);
      }
      return match;
    });

    username = username.slice(0,32-newTag.length);
    let newUsername = username + newTag;
    try { 
      member.setNickname(newUsername);
    } catch (err) {
      // console.log(err)
    }
  }
  
  // Instance getter
  get instance() {
    return client.instances.get(this.guild);
  }

  // Card-related methods
  get card() {
    return this.cards[this.cardIndex];
  }
}

class Card {
  constructor({
    name="",
    color="",
    attributes=[],
    isPrivate=false
  }) {
    this.name = name;
    this.color = color;
    this.attributes = new Collection(attributes);
    this.isPrivate = isPrivate;
  }

  hasAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    return this.attributes.has(cleanAttr);
  }
  getAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    return this.attributes.get(cleanAttr);
  }
  setAttr(attr, value) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    let val = parseInt(value);

    if (!val) 
      throw TypeError('"value" cannot be converted to number');
    
    if (!this.hasAttr(cleanAttr))
      throw ReferenceError(`"${cleanAttr}" is not a defined attribute`);
    
    this.attributes.set(cleanAttr, val);
    return this;
  }
  addAttr(attr, value) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    let val = parseInt(value) || 0;
    
    if (!possibleAttr.test(cleanAttr))
      throw SyntaxError(`"attr" does not match the regex ${possibleAttr}`)

    this.attributes.set(cleanAttr, val);
    return this;
  }
  removeAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    if (this.hasAttr(cleanAttr))
      this.attributes.delete(cleanAttr);
    return this;
  }
  setPrivate(value) {
    this.private = !!value;
    return this;
  }
}
Card.prototype.toJSON = toJSON;

function hasDMPermissions(member, DMrole) {
  return member.roles.cache.has(DMrole) || member.permissions.has(8n);
}

// Export
const Rog = {
  client:{},
  Instance,
  InstanceSettings,
  Player,
  Card,
  hasDMPermissions,
  possibleAttr
}
module.exports = Rog;

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

class InstanceHolder extends Collection {
  greate(key) {
    if (this.has(key))
      return this.get(key);
    const newInstance = new Instance({ id:key });
    this.set(key, newInstance);
    return newInstance;
  }
}

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
  greateUser(userId) {
    if (this.hasUser(userId)) {
      return this.getUser(userId);
    }
    return this.createUser(userId);
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
    this.cards = cards.map(c => new Card({...c, playerId:this.id, guildId:this.guildId}));
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
    playerId="",
    guildId="",
    color="",
    attributes=[],
    bars=[],
    isPrivate=false
  }) {
    this.name = name;
    this.playerId = playerId;
    this.guildId = guildId;
    this.color = color;
    this.attributes = new Collection(attributes);

    this.bars = bars.map(b => new CardBar({...b, playerId:this.playerId, guildId:this.guildId}))

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

    if (val == null) 
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

  /**
   * @param {CardBar} bar 
   */
  getBar(bar, barMax=6, fill="<:bar:957419774533591091>", empty="<:barempty:957419773954760735>") {
    let value = this.getAttr(bar.value);
    let max = this.getAttr(bar.max);
    if (value == null || max == null) return "ATRIBUTO INVÁLIDO";

    const ratio = value/max;
    let barCount;
    if (ratio > 1 || isNaN(ratio))
      barCount = barMax;
    else if (ratio < 0)
      barCount = 0;
    else
      barCount = Math.round(ratio*barMax);

    // return `${value}/${max} (${Math.round(ratio * 100)}%)\n\`[${"█".repeat(barCount)}${" ".repeat(barMax-barCount)}]\``;
    return `${value}/${max} (${Math.round(ratio * 100)}%)\n[${fill.repeat(barCount)}${empty.repeat(barMax-barCount)}]`;
  }
}
Card.prototype.toJSON = toJSON;

class CardBar {
  constructor({
    name="",
    value="",
    max=""
  }) {
    this.name = name;
    this.value = value;
    this.max = max;
  }
}

function hasDMPermissions(member, DMrole) {
  return member.roles.cache.has(DMrole) || member.permissions.has(8n);
}

// Export
const Rog = {
  client:{},
  InstanceHolder,
  Instance,
  InstanceSettings,
  Player,
  Card,
  CardBar,
  hasDMPermissions,
  possibleAttr
}
module.exports = Rog;

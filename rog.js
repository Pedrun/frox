const { Collection } = require("@discordjs/collection");
const chalk = require("chalk");
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

class InstanceManager extends Collection {
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
    scripts=[]
  }) {
    this.id = id;
    this.users = new Collection(users)
      .mapValues(v => new Player({...v, guildId:this.id}));

    this.settings = new InstanceSettings(settings);
    this.scripts = new Collection(scripts);
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

const tagRegex = /\{([A-Z_]+)\}/g;
class Player {
  constructor({
    id="",
    guildId="",
    nameSuffix="",
    suffixSeparator="",
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
  setSuffix(separator="", suffix="") {
    this.suffixSeparator = separator;
    this.nameSuffix = suffix;
    return this;
  }
  async updateSuffix() {
    if (!this.nameSuffix.length || !this.suffixSeparator.length)
      return;
    let newTag = this.nameSuffix.replace(tagRegex, (match, group) => {
      let attr = group.toUpperCase();
      if (this.card.hasAttr(attr))
        return this.card.getAttr(group.toUpperCase())
      return match;
    });
    
    try {
      const guild = await Rog.client.guilds.fetch(this.guildId);
      const member = await guild.members.fetch(this.id);
      let username = member.displayName.split(this.suffixSeparator)[0];
      username = username.slice(0, 32-(newTag.length + this.suffixSeparator.length));

      await member.setNickname(username + this.suffixSeparator + newTag);
    } catch (e) {
      console.log(chalk.red(e));
    }
  }
  
  // Instance getter
  get instance() {
    return Rog.client.instances.get(this.guild);
  }

  // Current Card getter
  get card() {
    return this.cards[this.cardIndex];
  }
}

class Card {
  constructor({
    name="",
    color="",
    attributes=[],
    buffs=[],
    bars=[],
    isPrivate=false
  }) {
    this.name = name;
    this.color = color;
    this.attributes = new Collection(attributes);

    this.buffs = buffs.map(b => new CardBuff(b));
    this.bars = bars.map(b => new CardBar(b));

    this.isPrivate = isPrivate;
  }

  hasAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    return this.attributes.has(cleanAttr);
  }
  getAttr(attr) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    if (!this.hasAttr(cleanAttr)) return;
    return this.attributes.get(cleanAttr);
  }
  getAttrBulk() {
    return this.attributes.map((v,k) => this.getAttr(k));
  }
  setAttr(attr, value, autoRename=true) {
    let cleanAttr = normalizeStr(attr.toUpperCase());
    if (!this.hasAttr(cleanAttr))
      throw ReferenceError(`"${cleanAttr}" is not a defined attribute`);
    
    let val = parseInt(value);
    if (val == null || !isFinite(val)) return this;
    
    this.attributes.set(cleanAttr, val);
    return this;
  }
  setAttrBulk(attrMap) {
    for (let [k, v] of attrMap) {
      let cleanAttr = normalizeStr(k.toUpperCase());
      if (this.hasAttr(cleanAttr))
        this.setAttr(k, v);
    }

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
  getBar(bar, barSize=6, fill="<:bar2:957638608490217502>", empty="<:barempty2:957638608557322270>") {
    let value = this.getAttr(bar.value);
    let max = this.getAttr(bar.max);
    if (value == null || max == null) return "[ ATRIBUTO INVÁLIDO ]";

    const ratio = value/max;
    let barCount;
    if (ratio > 1 || isNaN(ratio))
      barCount = barSize;
    else if (ratio < 0)
      barCount = 0;
    else
      barCount = Math.round(ratio*barSize);

    return `${value}/${max} (${Math.round(ratio * 100)}%)\n[${fill.repeat(barCount)}${empty.repeat(barSize-barCount)}]`;
  }
  toString() {
    return this.name;
  }
}
Card.prototype.toJSON = toJSON;

class Attribute {
  constructor({
    value=0,
    dynamic=false
  }) {
    this.value = value;
    this.dynamic = dynamic;
  }
}

class AttrResponse {
  constructor(
    name="", base=0, buff=0,
  ) {
    this.name = name;
    this.base = base;
    this.buff = buff;
    this.total = base + buff;
  }
  valueOf() {
    return this.total;
  }
  toString() {
    return this.base + (this.buff == 0)?"":`(+${this.buff})`;
  }
}

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

class CardBuff {
  constructor({
    name="",
    duration=0,
    rounds=0,
    icon = "",
    values=[],
  }) {
    this.name = name;
    this.icon = icon;

    this.duration = duration;
    this.rounds = rounds;

    this.values = new Collection(values);
  }
}
CardBuff.prototype.toJSON = toJSON;

function hasDMPermissions(member, DMrole) {
  return member.roles.cache.has(DMrole) || member.permissions.has(8n);
}

// Export
const Rog = {
  client:{},
  InstanceManager,
  Instance,
  InstanceSettings,
  Player,
  Card,
  AttrResponse,
  CardBar,
  CardBuff,
  hasDMPermissions,
  possibleAttr
}
module.exports = Rog;

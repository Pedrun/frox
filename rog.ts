import { Collection, GuildMember } from 'discord.js';
import { normalizeStr } from './util';
import { FroxClient } from './client';
import { red } from 'chalk';

interface ToJSON {
    toJSON(): Object;
}

function toJSON(this: Instance | Card) {
    let json: Record<string, any> = {};

    for (let [key, val] of Object.entries(this)) {
        if (val instanceof Map) {
            json[key] = Array.from(val);
        } else {
            json[key] = val;
        }
    }

    return json;
}

export const possibleAttr = /^[A-Z_]{1,32}$/;

export class InstanceManager extends Collection<string, Instance> {
    greate(key: string) {
        let ins = this.get(key);
        if (ins != null) return ins;
        const newInstance = new Instance({ id: key });
        this.set(key, newInstance);
        return newInstance;
    }
}

export class Instance implements ToJSON {
    id: string;
    users: Collection<string, Player>;
    settings: InstanceSettings;
    scripts: Collection<string, string>;

    constructor({ id = '', users = [], settings = {}, scripts = [] }) {
        this.id = id;
        this.users = new Collection<string, Object>(users).mapValues(
            (v) => new Player({ ...v, guildId: this.id })
        );

        this.settings = new InstanceSettings(settings);
        this.scripts = new Collection(scripts);
    }

    get guild() {
        return Rog.client?.guilds.fetch(this.id);
    }

    createUser(userId: string) {
        const newUser = new Player({
            id: userId,
        });
        this.users.set(userId, newUser);
        return newUser;
    }
    hasUser(userId: string) {
        return this.users.has(userId);
    }
    getUser(userId: string) {
        return this.users.get(userId);
    }
    greateUser(userId: string) {
        let user = this.getUser(userId);
        if (user != null) return user;
        return this.createUser(userId);
    }
    get toJSON() {
        return toJSON;
    }
}

export class InstanceSettings {
    alarmChannel: string;
    listChannel: string;
    DMRole: string;
    constructor({ alarmChannel = '', listChannel = '', DMrole = '' }) {
        this.alarmChannel = alarmChannel;
        this.listChannel = listChannel;
        this.DMRole = DMrole;
    }
}

const tagRegex = /\{([A-Z_]+)\}/g;

export class Player {
    id: string;
    guildId: string;
    nameSuffix: string;
    suffixSeparator: string;
    cardIndex: number;
    cards: Card[];
    constructor({
        id = '',
        guildId = '',
        nameSuffix = '',
        suffixSeparator = '',
        cardIndex = 0,
        cards = [],
    }) {
        this.id = id;
        this.guildId = guildId;
        this.nameSuffix = nameSuffix;
        this.suffixSeparator = suffixSeparator;

        this.cardIndex = cardIndex;
        this.cards = cards.map(
            (c: Object) =>
                new Card({ ...c, playerId: this.id, guildId: this.guildId })
        );
    }

    // Nickname-suffix-related methods
    setSuffix(separator = '', suffix = '') {
        this.suffixSeparator = separator;
        this.nameSuffix = suffix;
        return this;
    }
    async updateSuffix() {
        if (!this.nameSuffix.length || !this.suffixSeparator.length) return;
        let newTag = this.nameSuffix.replace(
            tagRegex,
            (match, group: string) => {
                let attr = group.toUpperCase();
                return (
                    this.card.getAttr(group.toUpperCase())?.toString() ?? match
                );
            }
        );

        try {
            const guild = await Rog.client?.guilds.fetch(this.guildId);
            const member = await guild?.members.fetch(this.id);
            let username = member?.displayName.split(this.suffixSeparator)[0];
            username = username?.slice(
                0,
                32 - (newTag.length + this.suffixSeparator.length)
            );

            await member?.setNickname(username + this.suffixSeparator + newTag);
        } catch (e) {
            // console.log(red(e));
        }
    }

    // Instance getter
    get instance() {
        return Rog.client?.instances.get(this.guildId);
    }

    // Current Card getter
    get card() {
        return this.cards[this.cardIndex];
    }
}

export class Card implements ToJSON {
    playerId: string;
    guildId: string;
    name: string;
    color: string;
    attributes: Collection<string, number>;
    bars: CardBar[];
    isPrivate: boolean;
    constructor({
        playerId = '',
        guildId = '',
        name = '',
        color = '',
        attributes = [],
        buffs = [],
        bars = [],
        isPrivate = false,
    }) {
        (this.playerId = playerId),
            (this.guildId = guildId),
            (this.name = name);
        this.color = color;
        this.attributes = new Collection(attributes);

        this.bars = bars.map((b) => new CardBar(b));

        this.isPrivate = isPrivate;
    }

    hasAttr(attr: string) {
        let cleanAttr = normalizeStr(attr.toUpperCase());
        if (cleanAttr != null) return this.attributes.has(cleanAttr);
        else return false;
    }
    getAttr(attr: string) {
        let cleanAttr = normalizeStr(attr.toUpperCase());
        if (cleanAttr == null) return;
        if (!this.hasAttr(cleanAttr)) return;
        return this.attributes.get(cleanAttr);
    }
    getAttrBulk() {
        return this.attributes.map((_v, k) => this.getAttr(k));
    }
    setAttr(attr: string, value: string | number) {
        let cleanAttr = normalizeStr(attr.toUpperCase());
        if (cleanAttr == null || !this.hasAttr(cleanAttr))
            throw ReferenceError(`"${cleanAttr}" is not a defined attribute`);

        if (typeof value == 'string') {
            value = parseInt(value);
        }
        if (value == null || !isFinite(value)) return this;

        this.attributes.set(cleanAttr, value);
        return this;
    }
    setAttrBulk(attrMap: [string, number][]) {
        for (let [k, v] of attrMap) {
            let cleanAttr = normalizeStr(k.toUpperCase());
            if (cleanAttr != null && this.hasAttr(cleanAttr))
                this.setAttr(k, v);
        }

        return this;
    }
    addAttr(attr: string, value: string | number) {
        let cleanAttr = normalizeStr(attr.toUpperCase());
        if (cleanAttr == null) return this;
        if (typeof value == 'string') value = parseInt(value) || 0;

        if (!possibleAttr.test(cleanAttr))
            throw SyntaxError(
                `"attr" does not match the regex ${possibleAttr}`
            );

        this.attributes.set(cleanAttr, value);
        return this;
    }
    removeAttr(attr: string) {
        let cleanAttr = normalizeStr(attr.toUpperCase());
        if (cleanAttr != null && this.hasAttr(cleanAttr))
            this.attributes.delete(cleanAttr);
        return this;
    }
    setPrivate(value: boolean) {
        this.isPrivate = value;
        return this;
    }

    /**
     * @param {CardBar} bar
     */
    getBar(
        bar: CardBar,
        barSize = 6,
        fill = '<:bar2:957638608490217502>',
        empty = '<:barempty2:957638608557322270>'
    ) {
        let value = this.getAttr(bar.value);
        let max = this.getAttr(bar.max);
        if (value == null || max == null) return '[ ATRIBUTO INVÁLIDO ]';

        const ratio = value / max;
        let barCount;
        if (ratio > 1 || isNaN(ratio)) barCount = barSize;
        else if (ratio < 0) barCount = 0;
        else barCount = Math.round(ratio * barSize);

        return `${value}/${max} (${Math.round(ratio * 100)}%)\n[${fill.repeat(
            barCount
        )}${empty.repeat(barSize - barCount)}]`;
    }
    toString() {
        return this.name;
    }
    get toJSON() {
        return toJSON;
    }
}

export class CardBar {
    name: string;
    value: string;
    max: string;
    constructor({ name = '', value = '', max = '' }) {
        this.name = name;
        this.value = value;
        this.max = max;
    }
}

export function hasDMPermissions(member: GuildMember, DMRole: string) {
    return member.roles.cache.has(DMRole) || member.permissions.has(8n);
}

// Export
interface Rog {
    client: FroxClient | undefined;
}

export let Rog: Rog = {
    client: undefined,
};

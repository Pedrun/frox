import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    ContextMenuCommandInteraction,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    SlashCommandBuilder,
} from 'discord.js';
import * as froxscript from './dll/parser';
import { InstanceManager, Player } from './rog';
import * as fs from 'fs';
import { greenBright, magenta, red } from 'chalk';
import { ellipsis, normalizeStr } from './util';

interface Autocomplete {
    name: string;
    execute: (interaction: AutocompleteInteraction, client: FroxClient) => void;
}

interface Command {
    data: SlashCommandBuilder;
    execute: (
        interaction:
            | ChatInputCommandInteraction
            | ContextMenuCommandInteraction,
        client: FroxClient
    ) => void;
}

interface Component {
    name: string;
    execute: (
        interaction: ModalSubmitInteraction | MessageComponentInteraction,
        client: FroxClient
    ) => void;
}

export class FroxClient extends Client {
    instances: InstanceManager = new InstanceManager();
    autocomplete: Collection<string, Autocomplete> = new Collection();
    commands: Collection<string, Command> = new Collection();
    components: Collection<string, Component> = new Collection();
    async saveInstances() {
        this.instances.each((v, k) => {
            fs.writeFileSync(
                `./saves/${k}.json`,
                JSON.stringify(v, null, '\t')
            );
        });
        console.log(
            `\n[${greenBright(
                'SAVE'
            )}] Todos os saves foram salvos em "./saves" ${magenta(Date())}`
        );
    }
    evaluateRoll(
        text: string,
        player: Player,
        forceOutput = false,
        variables: Collection<string, number> = new Collection()
    ) {
        let content = normalizeStr(text);

        try {
            let attributes = new Collection();
            if (player.card) {
                attributes = attributes.concat(player.card.attributes);
            }
            if (variables) {
                attributes = attributes.concat(variables);
            }
            const attrRecord = Object.fromEntries(attributes);
            let roll = froxscript.parse(content, attrRecord);

            if (roll == null) return;
            const { cons, attrMap } = roll;

            if (forceOutput || (cons.length && cons.some((r) => r.dice))) {
                let results = cons.reduce((a, b) => `${a}${b.text}\n`, '');
                results = ellipsis(results);

                if (player.card != null) {
                    player.card.setAttrBulk(Object.entries(attrMap));
                    player.updateSuffix();
                }
                return results;
            }
        } catch (e) {
            console.log(red(e));
            return null;
        }
    }
}

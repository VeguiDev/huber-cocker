import fs from 'node:fs';
import path from 'node:path';
import Punish from './punish.js';

export default class Configuration {

    constructor(xpath) {

        this.path = xpath;
        this.data = {
            punishments: [],
            reportChannels: []
        };

        this.load();

    }

    load() {

        if(!fs.existsSync(this.path)) {

            this.save();
            return;

        }

        const data = JSON.parse(fs.readFileSync(this.path, 'utf-8'));

        this.data = data;
    }

    save() {
        const dir = path.dirname(this.path);

        if(!fs.existsSync(dir)) {

            fs.mkdirSync(dir, {
                recursive: true
            });

        }

        fs.writeFileSync(this.path, JSON.stringify(this.data), 'utf-8');
    }

}
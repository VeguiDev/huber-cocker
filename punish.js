export default class Punish {

    constructor(guild_id, user_id, interval, apply_at) {

        this.guild_id = guild_id;
        this.user_id = user_id;
        this.interval = interval;
        this.apply_at = apply_at;

    }

    isApplicable() {
        return Date.now() >= this.apply_at;
    }

    renew() {
        const lastTime = this.apply_at;

        this.apply_at = Date.now() + this.interval;

        return lastTime;
    }

}
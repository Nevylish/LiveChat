import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import Command from './interactions/classes/Command';
import { LiveChatServer } from './LiveChatServer';
import { Handlers } from './utils/Handlers';
import { Logger } from './utils/Logger';

export default class DiscordClient extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
    public livechat: LiveChatServer;

    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds],
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            partials: [Partials.Channel, Partials.User],
        });

        const token = process.env.TOKEN;
        if (!token) {
            Logger.error('Client', 'TOKEN is not defined in environment variables');
            process.exit(1);
        }

        this.start(token);
    }

    public async hasGuildPremiumSubscription(guildId: string): Promise<Boolean> {
        const SKU_PLUS = process.env.SKU_PLUS_ID;

        const entitlements = await this.application.entitlements.fetch({
            guild: guildId,
            skus: [SKU_PLUS],
            excludeDeleted: true,
            excludeEnded: true,
        });

        if (entitlements) {
            return true;
        }

        return false;
    }

    public updateActivity(size?: number): void {
        this.user?.setActivity(
            size
                ? `/livechat | ${size.toString() ?? '0'} ${size > 1 ? 'streameurs·euses' : 'streameur·euse'} en ligne`
                : '/livechat | livechat.nevylish.fr',
            { type: 3 },
        );
    }

    private async start(token: string): Promise<void> {
        Logger.log('Client', `Connecting to Discord...`);
        try {
            await this.login(token);

            this.livechat = new LiveChatServer(this);

            Handlers.setupEventListeners(this);
            await Handlers.setupCommands(this);

            Logger.success('Client', `Successfully connected to Discord !`);
        } catch (err) {
            Logger.error('Client', `Oops, connection to Discord failed:\n`, err);
            process.exit(1);
        }
    }
}

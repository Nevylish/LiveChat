import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { LiveChatServer } from './LiveChatServer';
import Command from './interactions/Command';
import { GuildPremiumCache } from './services/GuildPremiumCache';
import { Handlers } from './utils/Handlers';
import { Logger } from './utils/Logger';

export default class DiscordClient extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
    public readonly guildPremiumCache: GuildPremiumCache;
    public livechat!: LiveChatServer;

    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds],
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            partials: [Partials.Channel, Partials.User],
        });

        this.guildPremiumCache = new GuildPremiumCache(this);

        const token = process.env.TOKEN;
        if (!token) {
            Logger.error('Client', 'TOKEN is not defined in environment variables');
            process.exit(1);
        }

        this.start(token);
    }

    public async hasGuildPremiumSubscription(guildId: string): Promise<boolean> {
        await this.guildPremiumCache.ensureReady();
        return this.guildPremiumCache.has(guildId);
    }

    private lastActivitySize: number | null = null;

    public updateActivity(): void {
        const size = this.livechat.getConnectedStreamersCount();

        if (size === this.lastActivitySize) return;

        this.user?.setActivity(
            size > 0
                ? `/livechat | ${size > 1 ? 'streameurs·euses' : 'streameur·euse'} en ligne`
                : `/livechat | ${process.env.FRONTEND_URI!}`,
            { type: 3 },
        );

        this.lastActivitySize = size;
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

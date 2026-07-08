export namespace Discord {
    export const isDiscordUrl = (url: string): boolean => {
        return url.includes('cdn.discordapp.com') || url.includes('media.discordapp.net');
    };
}

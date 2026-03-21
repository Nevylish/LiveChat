export namespace URLValidations {
    // Longueur du nom d'utilisateur autorisée par Twitch
    // https://discuss.dev.twitch.com/t/max-length-for-user-names-and-display-names/21315
    const MIN_USERNAME_LENGTH = 4;
    const MAX_USERNAME_LENGTH = 25;

    // Longueur de l'id du serveur Discord
    // https://www.reddit.com/r/discordapp/comments/1fv8pen/how_long_are_discord_guild_ids/
    const MIN_GUILD_ID_LENGTH = 17;
    const MAX_GUILD_ID_LENGTH = 21;

    /**
     * Valide le nom d'utilisateur Twitch
     */
    export const validateUsername = (username: string): { valid: boolean; error?: string } => {
        if (username.length > MAX_USERNAME_LENGTH) {
            return {
                valid: false,
                error: `Le nom d'utilisateur est trop long. Max: ${MAX_USERNAME_LENGTH} caractères.`,
            };
        }

        if (username.length < MIN_USERNAME_LENGTH) {
            return {
                valid: false,
                error: `Le nom d'utilisateur est trop court. Min: ${MIN_USERNAME_LENGTH} caractères.`,
            };
        }

        // Caractères autorisés par Twitch
        const usernamePattern = /^[a-zA-Z0-9_\-]+$/;
        if (!usernamePattern.test(username)) {
            return {
                valid: false,
                error: "Le nom d'utilisateur contient des caractères non autorisés. Lettres, chiffres et underscores sont autorisés.",
            };
        }

        return { valid: true };
    };

    /**
     * Valide l'identifiant du serveur Discord
     */
    export const validateGuildId = (guildId: string): { valid: boolean; error?: string } => {
        if (guildId.length < MIN_GUILD_ID_LENGTH) {
            return {
                valid: false,
                error: `L'identifiant du serveur Discord est trop court. Min: ${MIN_GUILD_ID_LENGTH} caractères.`,
            };
        }

        if (guildId.length > MAX_GUILD_ID_LENGTH) {
            return {
                valid: false,
                error: `L'identifiant du serveur Discord est trop long. Max: ${MAX_GUILD_ID_LENGTH} caractères.`,
            };
        }

        const guildIdPattern = /^[0-9]+$/;
        if (!guildIdPattern.test(guildId)) {
            return {
                valid: false,
                error: "L'identifiant du serveur Discord contient des caractères non autorisés.",
            };
        }

        return { valid: true };
    };
}

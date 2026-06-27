export default function PublicServerRoleReminder() {
    return (
        <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs font-semibold leading-relaxed text-destructive/90">
            N'oubliez pas de restreindre l'accès par rôle sur un serveur public, sinon n'importe qui pourra exécuter
            /livechat et afficher des médias sur votre flux.
        </p>
    );
}

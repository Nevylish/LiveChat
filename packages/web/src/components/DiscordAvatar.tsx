import type { AuthUser } from '@livechat/types';
import { sanitizeDiscordAvatarUrl } from '@livechat/types';
import type { ImgHTMLAttributes } from 'react';

type DiscordAvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    user: AuthUser | null | undefined;
};

export function DiscordAvatar({ user, alt = 'Avatar', ...props }: DiscordAvatarProps) {
    return <img src={encodeURI(sanitizeDiscordAvatarUrl(user?.avatarUrl))} alt={alt} {...props} />;
}

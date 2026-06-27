import type { AuthUser } from '@livechat/types';
import type { ImgHTMLAttributes } from 'react';
import { getDiscordAvatarUrl } from '../lib/discord';

type DiscordAvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    user: AuthUser | null | undefined;
};

export function DiscordAvatar({ user, alt = 'Avatar', ...props }: DiscordAvatarProps) {
    return <img src={getDiscordAvatarUrl(user)} alt={alt} {...props} />;
}

type SeoProps = {
    title: string;
    description: string;
    path: string;
};

const SITE_URL = 'https://livechat.nevylish.fr';
const OG_IMAGE = 'https://livechat.nevylish.fr/assets/ico/android-chrome-512x512.png';

export default function Seo({ title, description, path }: SeoProps) {
    const url = `${SITE_URL}${path}`;

    return (
        <>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={OG_IMAGE} />

            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={OG_IMAGE} />
        </>
    );
}

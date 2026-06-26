import type { ReactNode } from 'react';
import Footer from './Footer';
import Header from './Header';
import Seo from './Seo';

interface PageShellProps {
    title: string;
    description: string;
    path: string;
    children: ReactNode;
}

export default function PageShell({ title, description, path, children }: PageShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Seo title={title} description={description} path={path} />
            <Header />
            {children}
            <Footer />
        </div>
    );
}

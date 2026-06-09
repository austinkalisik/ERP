import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return <div className="legacy-login-page">{children}</div>;
}

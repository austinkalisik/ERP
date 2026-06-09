export default function LegacyLogo({
    compact = false,
    name = 'NextGen CRM',
    logoUrl,
}: {
    compact?: boolean;
    name?: string;
    logoUrl?: string | null;
}) {
    if (logoUrl) {
        return (
            <div
                className={
                    compact ? 'legacy-logo legacy-logo-compact' : 'legacy-logo'
                }
            >
                <img src={logoUrl} alt={name} className="legacy-logo-image" />
                <div className="legacy-logo-text custom">
                    <strong>{name}</strong>
                </div>
            </div>
        );
    }

    return (
        <div
            className={
                compact ? 'legacy-logo legacy-logo-compact' : 'legacy-logo'
            }
        >
            <div className="legacy-flag">
                <span />
            </div>
            <div className="legacy-logo-text">
                <strong>{name}</strong>
                <em>Technology</em>
            </div>
        </div>
    );
}

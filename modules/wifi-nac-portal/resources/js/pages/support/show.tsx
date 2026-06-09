import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, UserRound } from 'lucide-react';
import type { DomainHostingRequest } from '@/types';

type Props = {
    request: DomainHostingRequest;
    srNumber: string;
};

export default function SupportShow({ request, srNumber }: Props) {
    const customer = request.customer;

    return (
        <>
            <Head title={`Support Request ${srNumber}`} />
            <section className="legacy-panel legacy-detail">
                <div className="legacy-panel-title">
                    <span>Support Request Detail</span>
                    <Link
                        href="/support-requests"
                        className="legacy-title-link"
                    >
                        <ArrowLeft size={15} />
                        Back
                    </Link>
                </div>
                <div className="legacy-panel-body">
                    <div className="legacy-detail-header">
                        <div>
                            <strong>{srNumber}</strong>
                            <h2>{request.domain_name}</h2>
                            <p>{request.service_type.replaceAll('_', ' ')}</p>
                        </div>
                        <span>{request.status.replaceAll('_', ' ')}</span>
                    </div>

                    <div className="legacy-detail-grid">
                        <DetailCard
                            icon={UserRound}
                            title="Customer"
                            value={customer?.company_name ?? 'Unknown customer'}
                            detail={customer?.contact_name ?? customer?.email}
                        />
                        <DetailCard
                            icon={UserRound}
                            title="Assignee"
                            value={request.assignee?.name ?? 'Unassigned'}
                            detail={request.assignee?.email}
                        />
                        <DetailCard
                            icon={Calendar}
                            title="Dates"
                            value={`Start: ${request.requested_start_date ?? '-'}`}
                            detail={`Renewal: ${request.renewal_date ?? '-'}`}
                        />
                        <DetailCard
                            icon={DollarSign}
                            title="Commercial"
                            value={`Plan: ${request.plan}`}
                            detail={`Quote: ${request.quoted_amount ?? '-'}`}
                        />
                    </div>

                    <div className="legacy-detail-notes">
                        <section>
                            <h3>Requirements</h3>
                            <p>
                                {request.requirements ||
                                    'No requirements recorded.'}
                            </p>
                        </section>
                        <section>
                            <h3>Internal Notes</h3>
                            <p>
                                {request.internal_notes ||
                                    'No internal notes recorded.'}
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}

function DetailCard({
    icon: Icon,
    title,
    value,
    detail,
}: {
    icon: React.ElementType;
    title: string;
    value: string;
    detail?: string | null;
}) {
    return (
        <article>
            <Icon />
            <span>{title}</span>
            <strong>{value}</strong>
            {detail && <small>{detail}</small>}
        </article>
    );
}

SupportShow.layout = {
    breadcrumbs: [
        { title: 'Support Requests', href: '/support-requests' },
        { title: 'Request Detail', href: '#' },
    ],
};

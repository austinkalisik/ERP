export type Customer = {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string | null;
    industry: string | null;
    status: 'lead' | 'active' | 'inactive' | 'suspended';
    website: string | null;
    address: string | null;
    notes: string | null;
    next_follow_up_at: string | null;
    domain_hosting_requests_count?: number;
    created_at: string;
    updated_at: string;
};

export type DomainHostingRequest = {
    id: number;
    customer_id: number;
    assigned_to: number | null;
    domain_name: string;
    service_type: string;
    plan: string;
    status: string;
    requested_start_date: string | null;
    renewal_date: string | null;
    quoted_amount: string | number | null;
    requirements: string | null;
    internal_notes: string | null;
    customer?: Pick<Customer, 'id' | 'company_name' | 'contact_name' | 'email'>;
    assignee?: { id: number; name: string; email?: string } | null;
    created_at: string;
    updated_at: string;
};

export type CustomerSubscription = {
    id: number;
    customer_id: number;
    service_type:
        | 'domain_hosting'
        | 'internet_service'
        | 'gps'
        | 'email_hosting'
        | 'website_hosting'
        | 'other';
    service_label: string;
    service_name: string | null;
    reference: string | null;
    status: 'active' | 'suspended' | 'cancelled' | 'expired';
    starts_at: string | null;
    expires_at: string | null;
    renewal_cycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    amount: string | number | null;
    notes: string | null;
    customer?: Pick<
        Customer,
        'id' | 'company_name' | 'contact_name' | 'email' | 'phone' | 'status'
    >;
    payments: SubscriptionPayment[];
    credits: SubscriptionCredit[];
};

export type SubscriptionPayment = {
    id: number;
    paid_at: string | null;
    period_start: string | null;
    period_end: string | null;
    amount: string | number;
    payment_reference: string | null;
    invoice_number: string | null;
    file_name: string | null;
    file_url: string | null;
    notes: string | null;
};

export type SubscriptionCredit = {
    id: number;
    starts_at: string;
    ends_at: string;
    months: number;
    amount: string | number | null;
    applied_to_expires_at: string | null;
    reason: string | null;
};

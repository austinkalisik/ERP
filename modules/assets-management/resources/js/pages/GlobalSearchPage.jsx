import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const BASE_SEARCH_SECTIONS = [
    {
        key: 'inventory',
        title: 'Inventory',
        endpoint: '/items',
        viewPath: '/inventory',
        description: 'Items, asset tags, SKUs, brands, categories, suppliers, and locations',
        mapItem: (item) => ({
            title: item.name || 'Inventory item',
            detail: [item.asset_tag, item.sku, item.category?.name, item.supplier?.name].filter(Boolean).join(' | '),
            meta: `Quantity: ${item.quantity ?? 0} ${item.unit_of_measurement || 'unit'}`,
        }),
    },
    {
        key: 'assignments',
        title: 'Assignments',
        endpoint: '/assignments',
        viewPath: '/assignments',
        description: 'Receivers, assigned assets, departments, tags, and assignment status',
        mapItem: (item) => ({
            title: item.receiver_name || item.receiver || 'Assignment',
            detail: [
                item.item?.name || item.item_name,
                item.assigned_department?.name || item.department?.name || item.department_name,
                item.status,
            ]
                .filter(Boolean)
                .join(' | '),
            meta: item.assigned_at ? `Assigned: ${new Date(item.assigned_at).toLocaleDateString()}` : '',
        }),
    },
    {
        key: 'suppliers',
        title: 'Suppliers',
        endpoint: '/suppliers',
        viewPath: '/suppliers',
        description: 'Supplier names, email addresses, phone numbers, and addresses',
        mapItem: (item) => ({
            title: item.name || 'Supplier',
            detail: [item.email, item.phone].filter(Boolean).join(' | '),
            meta: item.address || '',
        }),
    },
    {
        key: 'categories',
        title: 'Categories',
        endpoint: '/categories',
        viewPath: '/categories',
        description: 'Category names and descriptions',
        mapItem: (item) => ({
            title: item.name || 'Category',
            detail: item.description || '',
            meta: '',
        }),
    },
    {
        key: 'departments',
        title: 'Departments',
        endpoint: '/departments',
        viewPath: '/departments',
        description: 'Department names, codes, and descriptions',
        mapItem: (item) => ({
            title: item.name || 'Department',
            detail: [item.code, item.description].filter(Boolean).join(' | '),
            meta: '',
        }),
    },
    {
        key: 'users',
        title: 'Users',
        endpoint: '/users',
        viewPath: '/users',
        description: 'User names, emails, and roles',
        mapItem: (item) => ({
            title: item.name || item.email || 'User',
            detail: item.email || '',
            meta: item.role || '',
        }),
    },
];

function getRows(payload) {
    return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
}

function getTotal(payload, rows) {
    return Number(payload?.total ?? rows.length);
}

export default function GlobalSearchPage() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const query = searchParams.get('q')?.trim() || '';
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const searchSections = useMemo(
        () => BASE_SEARCH_SECTIONS.filter((section) => section.key !== 'users' || user?.role === 'admin'),
        [user?.role]
    );

    const totalMatches = useMemo(
        () => Object.values(results).reduce((sum, section) => sum + Number(section.total || 0), 0),
        [results]
    );

    useEffect(() => {
        let isMounted = true;

        async function runSearch() {
            if (!query) {
                setResults({});
                return;
            }

            setLoading(true);

            const responses = await Promise.all(
                searchSections.map(async (section) => {
                    try {
                        const response = await apiClient.get(section.endpoint, {
                            params: { search: query, per_page: 5 },
                        });
                        const rows = getRows(response.data);

                        return [section.key, { rows, total: getTotal(response.data, rows), error: '' }];
                    } catch (error) {
                        return [
                            section.key,
                            {
                                rows: [],
                                total: 0,
                                error: error?.response?.data?.message || 'This area could not be searched.',
                            },
                        ];
                    }
                })
            );

            if (isMounted) {
                setResults(Object.fromEntries(responses));
                setLoading(false);
            }
        }

        void runSearch();

        return () => {
            isMounted = false;
        };
    }, [query, searchSections]);

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h1 className="text-3xl font-bold text-slate-900">System Search</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {query ? `Searching all major records for "${query}".` : 'Use the top search bar to search across the system.'}
                </p>
            </section>

            {query ? (
                <div className="px-4 py-3 text-sm font-semibold text-blue-700 border border-blue-100 rounded-xl bg-blue-50">
                    {loading ? 'Searching...' : `${totalMatches} matching record${totalMatches === 1 ? '' : 's'} found`}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {searchSections.map((section) => {
                    const sectionResult = results[section.key] || { rows: [], total: 0, error: '' };

                    return (
                        <section key={section.key} className="bg-white border shadow-sm rounded-xl border-slate-200">
                            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                                    <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                                </div>

                                <Link
                                    to={`${section.viewPath}${query ? `?search=${encodeURIComponent(query)}` : ''}`}
                                    className="px-3 py-2 text-xs font-bold text-blue-700 transition border border-blue-200 rounded-lg shrink-0 bg-blue-50 hover:bg-blue-100"
                                >
                                    Open
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {sectionResult.error ? (
                                    <div className="px-5 py-4 text-sm text-red-600">{sectionResult.error}</div>
                                ) : sectionResult.rows.length > 0 ? (
                                    sectionResult.rows.map((item, index) => {
                                        const mapped = section.mapItem(item);

                                        return (
                                            <Link
                                                key={item.id || `${section.key}-${index}`}
                                                to={`${section.viewPath}?search=${encodeURIComponent(query)}`}
                                                className="block px-5 py-3 transition hover:bg-slate-50"
                                            >
                                                <p className="font-semibold text-slate-900">{mapped.title}</p>
                                                {mapped.detail ? <p className="mt-1 text-sm text-slate-600">{mapped.detail}</p> : null}
                                                {mapped.meta ? <p className="mt-1 text-xs text-slate-400">{mapped.meta}</p> : null}
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="px-5 py-4 text-sm text-slate-500">
                                        {loading ? 'Checking records...' : query ? 'No matches in this area.' : 'No search entered.'}
                                    </div>
                                )}
                            </div>

                            {sectionResult.total > sectionResult.rows.length ? (
                                <div className="px-5 py-3 text-xs font-semibold border-t border-slate-100 text-slate-500">
                                    Showing {sectionResult.rows.length} of {sectionResult.total}. Open this area to see all matches.
                                </div>
                            ) : null}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

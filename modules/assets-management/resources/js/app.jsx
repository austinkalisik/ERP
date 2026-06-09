import '../css/app.css';
import './bootstrap';

import React, { Suspense, lazy, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';

const routeImports = {
    '/login': () => import('./pages/LoginPage'),
    '/dashboard': () => import('./pages/DashboardPage'),
    '/inventory': () => import('./pages/ItemsPage'),
    '/assignments': () => import('./pages/AssignmentsPage'),
    '/categories': () => import('./pages/CategoriesPage'),
    '/departments': () => import('./pages/DepartmentsPage'),
    '/receivers': () => import('./pages/ReceiversPage'),
    '/suppliers': () => import('./pages/SuppliersPage'),
    '/notifications': () => import('./pages/NotificationsPage'),
    '/activity-logs': () => import('./pages/ActivityLogsPage'),
    '/profile': () => import('./pages/ProfilePage'),
    '/users': () => import('./pages/UsersPage'),
    '/settings': () => import('./pages/SettingsPage'),
    '/search': () => import('./pages/GlobalSearchPage'),
    '/user-guide': () => import('./pages/UserguidePage'),
};

const preloadCache = new Map();

function preloadRoute(pathname) {
    const importer = routeImports[pathname];

    if (!importer) {
        return null;
    }

    if (!preloadCache.has(pathname)) {
        preloadCache.set(pathname, importer());
    }

    return preloadCache.get(pathname);
}

window.__nextgenPreloadRoute = preloadRoute;

const LoginPage = lazy(routeImports['/login']);
const DashboardPage = lazy(routeImports['/dashboard']);
const ItemsPage = lazy(routeImports['/inventory']);
const AssignmentsPage = lazy(routeImports['/assignments']);
const CategoriesPage = lazy(routeImports['/categories']);
const DepartmentsPage = lazy(routeImports['/departments']);
const ReceiversPage = lazy(routeImports['/receivers']);
const SuppliersPage = lazy(routeImports['/suppliers']);
const NotificationsPage = lazy(routeImports['/notifications']);
const ActivityLogsPage = lazy(routeImports['/activity-logs']);
const ProfilePage = lazy(routeImports['/profile']);
const UsersPage = lazy(routeImports['/users']);
const SettingsPage = lazy(routeImports['/settings']);
const GlobalSearchPage = lazy(routeImports['/search']);
const UserguidePage = lazy(routeImports['/user-guide']);

function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
                <p className="mt-4 text-sm font-medium text-slate-600">Loading Nextgen Assets Management System...</p>
                <p className="mt-1 text-xs text-slate-500">Preparing your workspace</p>
            </div>
        </div>
    );
}

function PageLoader() {
    return (
        <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 mx-auto border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
                <p className="mt-3 text-sm text-slate-600">Loading page...</p>
            </div>
        </div>
    );
}

function GuestRoute({ children }) {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

function RoutePreloader() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        preloadRoute(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthenticated) {
            preloadRoute('/login');
            return undefined;
        }

        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
            preloadRoute('/dashboard');
            return undefined;
        }

        const protectedRoutes = ['/dashboard', '/inventory', '/assignments'].filter((path) => path !== location.pathname);
        const warmRoutes = () => protectedRoutes.forEach((path) => preloadRoute(path));

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(warmRoutes, { timeout: 3000 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(warmRoutes, 1200);
        return () => window.clearTimeout(timeoutId);
    }, [isAuthenticated, location.pathname]);

    return null;
}

function ProtectedLayout() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <SettingsProvider>
            <Layout>
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </Layout>
        </SettingsProvider>
    );
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <LoginPage />
                    </GuestRoute>
                }
            />

            <Route path="/items" element={<Navigate to="/inventory" replace />} />

            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/inventory" element={<ItemsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/receivers" element={<ReceiversPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/activity-logs" element={<ActivityLogsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/search" element={<GlobalSearchPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/user-guide" element={<UserguidePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <RoutePreloader />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('app');

if (rootElement) {
    if (!window.__nextgenReactRoot) {
        window.__nextgenReactRoot = ReactDOM.createRoot(rootElement);
    }

    window.__nextgenReactRoot.render(<App />);
}

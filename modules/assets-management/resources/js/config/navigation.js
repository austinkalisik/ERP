export const navigationSections = [
    {
        label: 'Operations',
        items: [
            {
                label: 'Dashboard',
                to: '/dashboard',
                match: ['/dashboard'],
                icon: 'dashboard',
            },
            {
                label: 'Inventory',
                to: '/inventory',
                match: ['/inventory', '/items'],
                icon: 'inventory',
            },
            {
                label: 'Assignments',
                to: '/assignments',
                match: ['/assignments'],
                icon: 'assignments',
            },
            {
                label: 'Suppliers',
                to: '/suppliers',
                match: ['/suppliers'],
                icon: 'suppliers',
            },
            {
                label: 'User Guide',
                to: '/user-guide',
                match: ['/user-guide'],
                icon: 'userguide',
            },
        ],
    },
    {
        label: 'Administration',
        items: [
            {
                label: 'Categories',
                to: '/categories',
                match: ['/categories'],
                icon: 'categories',
            },
            {
                label: 'Departments',
                to: '/departments',
                match: ['/departments'],
                icon: 'departments',
            },
            {
                label: 'Receivers',
                to: '/receivers',
                match: ['/receivers'],
                icon: 'receivers',
            },
            {
                label: 'Users',
                to: '/users',
                match: ['/users'],
                icon: 'users',
            },
            {
                label: 'Notifications',
                to: '/notifications',
                match: ['/notifications'],
                icon: 'notifications',
            },
            {
                label: 'Activity Logs',
                to: '/activity-logs',
                match: ['/activity-logs'],
                icon: 'activityLogs',
            },
            {
                label: 'Settings',
                to: '/settings',
                match: ['/settings'],
                icon: 'settings',
            },
            {
                label: 'Profile',
                to: '/profile',
                match: ['/profile'],
                icon: 'profile',
            },
        ],
    },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

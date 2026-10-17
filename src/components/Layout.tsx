import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, Users, Truck, LayoutDashboard, Settings, FileText, LogOut } from 'lucide-react';
import { useApolloClient } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './ChatWidget';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Items', path: '/items', icon: Package },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Suppliers', path: '/suppliers', icon: Truck },
  { name: 'Invoices', path: '/invoices', icon: FileText },
];

export function Layout() {
  const location = useLocation();
  const client = useApolloClient();

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await client.clearStore();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-gray-50/50 relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-900 tracking-tight">Munshi App</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link to="/settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="mr-3 h-5 w-5 text-gray-400" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {location.pathname.substring(1) || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
}

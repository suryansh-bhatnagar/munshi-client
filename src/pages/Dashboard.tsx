import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      todaySales
      monthlyProfit
      pendingReceivables
      pendingPayables
      lowStockItems
      salesTrend {
        date
        sales
        purchases
      }
    }
  }
`;

const currency = (val: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

export const Dashboard = () => {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'network-only' });
  const [showProfit, setShowProfit] = useState(false);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading dashboard data</div>;

  const stats = data?.dashboardStats;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Top Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency(stats?.todaySales || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <button onClick={() => setShowProfit(!showProfit)} className="text-muted-foreground hover:text-gray-900 transition-colors">
              {showProfit ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showProfit ? currency(stats?.monthlyProfit || 0) : '******'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receivables</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{currency(stats?.pendingReceivables || 0)}</div>
            <p className="text-xs text-muted-foreground">To collect from customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchases (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.salesTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return `${d.getDate()}/${d.getMonth()+1}`;
                    }} 
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    formatter={(value: any) => currency(Number(value) || 0)}
                    labelFormatter={(label: any) => label ? new Date(label).toLocaleDateString() : ''}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#f43f5e" fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

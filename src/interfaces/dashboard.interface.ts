export interface DashboardStats {
  totalVehicles: {
    count: number;
    percentageChange: number;
  };
  totalCustomers: {
    count: number;
    percentageChange: number;
  };
  activeServices: {
    count: number;
    status: string;
  };
  monthlyRevenue: {
    amount: number;
    percentageChange: number;
  };
  serviceStatus: {
    completed: number;
    inProgress: number;
    pending: number;
  };
  totalRevenue: {
    amount: number;
    yearlyPercentageChange: number;
    description: string;
  };
  activeLocations: {
    count: number;
    description: string;
    cities: string[];
  };
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    status: string;
  }>;
}

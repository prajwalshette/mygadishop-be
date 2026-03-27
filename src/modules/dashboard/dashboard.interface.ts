export interface DashboardStats {
  totalVehicles: {
    count: number;
    percentageChange: number;
    available?: number;
    sold?: number;
    inMaintenance?: number;
    reserved?: number;
  };
  totalCustomers: {
    count: number;
    percentageChange: number;
    buyers?: number;
    sellers?: number;
    both?: number;
    growthTrend?: number;
  };
  monthlyRevenue: {
    amount: number;
    percentageChange: number;
    lastMonthAmount?: number;
    monthlyTarget?: number;
    targetProgress?: number;
    trend?: 'up' | 'down' | 'stable';
  };
  pendingInquiries?: {
    total: number;
    newLeads?: number;
    followUpsDue?: number;
    hotLeads?: number;
    coldLeads?: number;
  };
  upcomingServices?: {
    total: number;
    scheduledToday?: number;
    thisWeek?: number;
    overdue?: number;
    remindersSent?: number;
  };
  activeServices: {
    count: number;
    status: string;
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
    timeString?: string;
    status: string;
  }>;
}

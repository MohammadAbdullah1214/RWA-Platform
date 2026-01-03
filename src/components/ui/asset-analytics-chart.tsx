"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Placeholder data
const data = [
  { month: "Jan", totalUsers: 20000, revenueGrowth: 15000 },
  { month: "Feb", totalUsers: 25000, revenueGrowth: 18000 },
  { month: "Mar", totalUsers: 30000, revenueGrowth: 22000 },
  { month: "Apr", totalUsers: 35000, revenueGrowth: 28000 },
  { month: "May", totalUsers: 32000, revenueGrowth: 32000 },
  { month: "Jun", totalUsers: 38000, revenueGrowth: 30000 },
  { month: "Jul", totalUsers: 42000, revenueGrowth: 35000 },
  { month: "Aug", totalUsers: 45000, revenueGrowth: 38000 },
  { month: "Sep", totalUsers: 48000, revenueGrowth: 42000 },
  { month: "Oct", totalUsers: 50000, revenueGrowth: 45000 },
];

export function AssetAnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          {/* Gradient for first line (#2A5FA6) */}
          <linearGradient id="colorTotalUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2A5FA6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2A5FA6" stopOpacity={0} />
          </linearGradient>
          {/* Gradient for second line (#BC953D) */}
          <linearGradient id="colorRevenueGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BC953D" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#BC953D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#999" style={{ fontSize: "12px" }} />
        <YAxis stroke="#999" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
        <Line
          type="monotone"
          dataKey="totalUsers"
          stroke="#2A5FA6"
          strokeWidth={3}
          fill="url(#colorTotalUsers)"
          fillOpacity={1}
          dot={{ fill: "#2A5FA6", r: 4 }}
          activeDot={{ r: 6 }}
          name="Total Users"
        />
        <Line
          type="monotone"
          dataKey="revenueGrowth"
          stroke="#BC953D"
          strokeWidth={3}
          fill="url(#colorRevenueGrowth)"
          fillOpacity={1}
          dot={{ fill: "#BC953D", r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue Growth"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

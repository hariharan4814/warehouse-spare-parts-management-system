export type MetricType = {
  title: string;
  value: number;
  change: string;
  type: "success" | "warning" | "danger" | "info";
  iconName: string;
};

export type ActivityItem = {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "issue" | "purchase" | "supplier" | "update";
};

export type LowStockItem = {
  id: string;
  name: string;
  partNumber: string;
  currentQty: number;
  minQty: number;
  status: "Low Stock" | "Out of Stock";
};

export const MOCK_METRICS: MetricType[] = [
  {
    title: "Total Spare Parts",
    value: 1245,
    change: "+12 this week",
    type: "info",
    iconName: "Package",
  },
  {
    title: "Available Items",
    value: 1084,
    change: "87% of capacity",
    type: "success",
    iconName: "CheckCircle",
  },
  {
    title: "Low Stock Alert",
    value: 18,
    change: "Requires attention",
    type: "warning",
    iconName: "AlertTriangle",
  },
  {
    title: "Out of Stock",
    value: 5,
    change: "Critical shortage",
    type: "danger",
    iconName: "XOctagon",
  },
  {
    title: "Pending Requests",
    value: 24,
    change: "8 pending approval",
    type: "warning",
    iconName: "Clock",
  },
  {
    title: "Issued Today",
    value: 42,
    change: "+15% vs yesterday",
    type: "info",
    iconName: "FileText",
  },
  {
    title: "Active Warehouses",
    value: 4,
    change: "Across 3 regions",
    type: "success",
    iconName: "Home",
  },
  {
    title: "Suppliers registered",
    value: 36,
    change: "9 preferred partners",
    type: "info",
    iconName: "Users",
  },
];

export const MOCK_INVENTORY_OVERVIEW = [
  { name: "Electrical", value: 400 },
  { name: "Mechanical", value: 300 },
  { name: "Pneumatic", value: 200 },
  { name: "Hydraulic", value: 150 },
  { name: "Fasteners", value: 195 },
];

export const MOCK_STOCK_IN_OUT = [
  { month: "Jan", "Stock In": 65, "Stock Out": 40 },
  { month: "Feb", "Stock In": 59, "Stock Out": 48 },
  { month: "Mar", "Stock In": 80, "Stock Out": 61 },
  { month: "Apr", "Stock In": 81, "Stock Out": 55 },
  { month: "May", "Stock In": 56, "Stock Out": 40 },
  { month: "Jun", "Stock In": 95, "Stock Out": 70 },
  { month: "Jul", "Stock In": 87, "Stock Out": 75 },
];

export const MOCK_MONTHLY_ACTIVITY = [
  { name: "W1 (Main)", requests: 120, issues: 110, returns: 15 },
  { name: "W2 (North)", requests: 80, issues: 75, returns: 8 },
  { name: "W3 (South)", requests: 95, issues: 90, returns: 12 },
  { name: "W4 (East)", requests: 50, issues: 45, returns: 5 },
];

export const MOCK_LOW_STOCK_TREND = [
  { week: "Week 1", items: 25 },
  { week: "Week 2", items: 22 },
  { week: "Week 3", items: 19 },
  { week: "Week 4", items: 18 },
];

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    user: "John Doe (Technician)",
    action: "issued",
    target: "Brake Pad (Part #BP-901)",
    time: "10 minutes ago",
    type: "issue",
  },
  {
    id: "act-2",
    user: "Alice Smith (Manager)",
    action: "approved Purchase Order",
    target: "PO-2026-004 (Hydraulic Pumps)",
    time: "1 hour ago",
    type: "purchase",
  },
  {
    id: "act-3",
    user: "Robert Chen (Storekeeper)",
    action: "added new supplier",
    target: "Industrial Valves Corp",
    time: "3 hours ago",
    type: "supplier",
  },
  {
    id: "act-4",
    user: "System Daemon",
    action: "updated stock levels",
    target: "O-Ring Kit (Warehouse 2)",
    time: "5 hours ago",
    type: "update",
  },
  {
    id: "act-5",
    user: "Sarah Connor (Technician)",
    action: "returned unused part",
    target: "Alternator Belt (Part #AB-402)",
    time: "Yesterday",
    type: "issue",
  },
];

export const MOCK_LOW_STOCK_ITEMS: LowStockItem[] = [
  {
    id: "ls-1",
    name: "Ball Bearing 6204",
    partNumber: "BB-6204",
    currentQty: 4,
    minQty: 15,
    status: "Low Stock",
  },
  {
    id: "ls-2",
    name: "Air Filter elements",
    partNumber: "AF-105",
    currentQty: 0,
    minQty: 10,
    status: "Out of Stock",
  },
  {
    id: "ls-3",
    name: "V-Belt A42",
    partNumber: "VB-A42",
    currentQty: 2,
    minQty: 8,
    status: "Low Stock",
  },
  {
    id: "ls-4",
    name: "Fuse 10A Glass",
    partNumber: "FG-010",
    currentQty: 15,
    minQty: 50,
    status: "Low Stock",
  },
  {
    id: "ls-5",
    name: "Pressure Gauge 10Bar",
    partNumber: "PG-010B",
    currentQty: 0,
    minQty: 5,
    status: "Out of Stock",
  },
];

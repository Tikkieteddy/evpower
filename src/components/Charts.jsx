// tikkieteddielab: Recharts visual summaries.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dailyChartData, routeAnalysis } from "../utils/calculations.js";

const colors = ["#0D6F8F", "#76B8C8", "#B7B4AA", "#2E3840", "#9DC7CF", "#C9C4B7"];

export default function Charts({ trips }) {
  const daily = dailyChartData(trips);
  const routes = routeAnalysis(trips).map((route) => ({
    name: route.routeName,
    value: route.totalCost,
    distance: route.totalDistance,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm xl:col-span-1">
        <h3 className="text-base font-bold text-[var(--marine-ink)]">ค่าใช้จ่ายรายวัน</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} บาท`, "ค่าชาร์จ"]} />
              <Bar dataKey="cost" fill="#0D6F8F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm xl:col-span-1">
        <h3 className="text-base font-bold text-[var(--marine-ink)]">ระยะทางรายวัน</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} กม.`, "ระยะทาง"]} />
              <Line type="monotone" dataKey="distance" stroke="#76B8C8" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--blonde-line)] bg-white p-4 shadow-sm xl:col-span-1">
        <h3 className="text-base font-bold text-[var(--marine-ink)]">สัดส่วนค่าใช้จ่ายตามเส้นทาง</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={routes} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {routes.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, _name, item) => [`${value} บาท`, item.payload.name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

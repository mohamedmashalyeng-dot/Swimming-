"use client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  new: "#1A8FD4", pending: "#F59E0B", approved: "#10B981", rejected: "#EF4444", completed: "#64748B",
};

export function RegistrationsChart({ data, label }: { data: { day: string; count: number }[]; label: string }) {
  return (
    <div className="h-64" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E3EBF3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#64748b" }} reversed={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#64748b" }} />
          <Tooltip cursor={{ fill: "#F4F8FB" }} contentStyle={{ borderRadius: 12, border: "1px solid #E3EBF3", fontSize: 12 }} />
          <Bar dataKey="count" name={label} fill="#0877B9" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPie({ data }: { data: { key: string; name: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key] ?? "#94a3b8"} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E3EBF3", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[d.key] }} aria-hidden="true" />
            <span className="text-slate-600">{d.name}</span>
            <span className="font-bold">{d.value}</span>
            <span className="text-xs text-slate-400">({total ? Math.round((d.value / total) * 100) : 0}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

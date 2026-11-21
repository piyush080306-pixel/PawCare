import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryCount } from '@/types/shelter';
import { formatMonth, speciesLabel } from '@/utils/format';

export const CHART_COLORS = ['#52745C', '#668BAA', '#D8A66A', '#8FA98F', '#B8C6B8'];

export function RadialGauge({
  value,
  label,
  caption,
  tone = '#52745C',
}: {
  value: number;
  label: string;
  caption?: string;
  tone?: string;
}) {
  const bounded = Math.max(0, Math.min(100, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (bounded / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgb(var(--line))" strokeWidth="9" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-lg font-semibold text-ink">{bounded.toFixed(1)}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-ink">{label}</p>
        {caption ? <p className="mt-1 text-xs leading-relaxed text-muted">{caption}</p> : null}
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid rgb(var(--line))',
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--ink))',
  fontSize: 11,
};

export function SpeciesDonut({
  data,
  onSelect,
}: {
  data: CategoryCount[];
  onSelect?: (label: string) => void;
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-xs text-muted">No animals registered yet.</p>;
  }
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
            onClick={entry => {
              const sector = entry as unknown as {
                payload?: CategoryCount;
                name?: string;
              };
              const label = sector.payload?.label ?? sector.name;
              if (label) onSelect?.(String(label));
            }}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [`${String(value)} animals`, speciesLabel(String(name))]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdoptionStatusChart({ data }: { data: CategoryCount[] }) {
  const chartData = data.map(item => ({
    name: speciesLabel(item.label),
    applications: item.count,
  }));
  if (chartData.length === 0) {
    return <p className="py-12 text-center text-xs text-muted">No applications submitted yet.</p>;
  }
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="rgb(var(--line))" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--subtle))' }} />
          <Bar dataKey="applications" radius={[5, 5, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  entry.name === 'Approved'
                    ? '#39865B'
                    : entry.name === 'Pending'
                      ? '#D49A43'
                      : entry.name === 'Rejected'
                        ? '#C85D5D'
                        : CHART_COLORS[index % CHART_COLORS.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdoptionTrendChart({ data }: { data: CategoryCount[] }) {
  const chartData = data.map(item => ({ month: formatMonth(item.label), adoptions: item.count }));
  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-xs text-muted">
        No approved adoptions have been recorded yet.
      </p>
    );
  }
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="adoptionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52745C" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#52745C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(var(--line))" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="adoptions"
            stroke="#52745C"
            strokeWidth={2}
            fill="url(#adoptionFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  color = '#52745C',
}: {
  data: CategoryCount[];
  color?: string;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-xs text-muted">No data available.</p>;
  }
  const chartData = data.map(item => ({ name: speciesLabel(item.label), value: item.count }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 16 }}
        >
          <CartesianGrid horizontal={false} stroke="rgb(var(--line))" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={80}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--subtle))' }} />
          <Bar dataKey="value" fill={color} radius={[0, 5, 5, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { STATS, STAT_META } from '../lib/game';

function AxisTick({ x, y, payload, textAnchor, stats }) {
  const stat = payload.value;
  const { color } = STAT_META[stat];
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor={textAnchor} dy={-2} fill={color} fontFamily="Russo One" fontSize={12} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
        {stat}
      </text>
      <text textAnchor={textAnchor} dy={12} fill="#e4e4e7" fontSize={11} fontWeight={700}>
        {stats[stat]}
      </text>
    </g>
  );
}

export default function StatRadar({ stats }) {
  const data = STATS.map((s) => ({ stat: s, value: stats[s] }));
  const top = Math.max(...Object.values(stats));
  const domain = Math.max(5, Math.ceil(top / 5) * 5);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%" margin={{ top: 16, right: 24, bottom: 8, left: 24 }}>
          <defs>
            <radialGradient id="radarFill">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.55} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="#22d3ee" strokeOpacity={0.15} gridType="polygon" />
          <PolarAngleAxis dataKey="stat" tick={(props) => <AxisTick {...props} stats={stats} />} />
          <PolarRadiusAxis domain={[0, domain]} tickCount={6} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#radarFill)"
            fillOpacity={1}
            dot={{ r: 3, fill: '#e0f7ff', stroke: '#22d3ee', strokeWidth: 2 }}
            isAnimationActive
            style={{ filter: 'drop-shadow(0 0 6px #22d3ee) drop-shadow(0 0 14px #a855f7aa)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

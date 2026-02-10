import { TrendingUp } from 'lucide-react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const BurndownChart = ({ data, totalPoints, securedPoints }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 dark:bg-slate-800/50 bg-slate-50 rounded-lg border dark:border-slate-700 border-slate-200">
                <p className="dark:text-slate-400 text-slate-500">No burndown data available</p>
            </div>
        );
    }

    return (
        <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group shadow-sm">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-cyan-600 dark:text-cyan-400" />
                        Sprint Velocity
                    </h3>
                    <p className="dark:text-slate-400 text-slate-500 text-xs mt-1">Ideal vs Actual Burn Rate</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        <span className="dark:text-slate-400 text-slate-500">Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full dark:bg-cyan-400 bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                        <span className="dark:text-cyan-400 text-cyan-600 font-bold">Actual</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            domain={[0, 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                color: '#fff'
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#22d3ee"
                            name="Points Secured"
                            strokeWidth={4}
                            dot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                            connectNulls
                            animationDuration={2000}
                        />
                        <Line
                            type="monotone"
                            dataKey="ideal"
                            stroke="#475569"
                            strokeDasharray="5 5"
                            name="Ideal Trend"
                            dot={false}
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 flex items-center justify-between border-t dark:border-white/5 border-slate-200 pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-widest font-bold">Total Scope</span>
                    <span className="text-xl font-bold dark:text-white text-slate-900">{totalPoints} <span className="text-sm dark:text-slate-500 text-slate-400 font-normal">pts</span></span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-widest font-bold">Verified Value</span>
                    <div className="flex items-baseline gap-1">
                        {(() => {
                            const lastActual = [...data].reverse().find(d => d.actual !== null);
                            // Priority: Explicit securedPoints from prop > Chart Data > 0
                            const secured = (typeof securedPoints === 'number')
                                ? securedPoints
                                : (lastActual ? lastActual.actual : 0);

                            const idealAtPoint = lastActual ? lastActual.ideal : data[0]?.ideal;

                            // In Burnup: If secured > ideal, that's GOOD (ahead of schedule), so Emerald.
                            // If secured < ideal, that's BAD (behind), so Amber.
                            const color = secured >= idealAtPoint ? 'text-emerald-400' : 'text-amber-400';

                            return (
                                <span className={`text-2xl font-black ${color}`}>
                                    {secured}
                                </span>
                            );
                        })()}
                        <span className="text-sm dark:text-slate-500 text-slate-400 font-normal">pts</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BurndownChart;

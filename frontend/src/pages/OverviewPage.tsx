import { useState, useEffect, useCallback, type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Eye,
  Network,
  Radio,
  Server,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  CartesianGrid,
} from 'recharts';
import type { DataService } from '../services/DataService';
import type {
  OverviewMetrics,
  PipelineHealthStatus,
  PaginatedResponse,
  ThreatAlert,
} from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ThreatClassBadge } from '../components/common/ThreatClassBadge';
import { ConfidenceGauge } from '../components/common/ConfidenceGauge';
import { StatusPill } from '../components/common/StatusPill';
import { DataStateWrapper, type DataState } from '../components/common/DataStateWrapper';
import { AlertDetailDrawer } from '../components/alerts/AlertDetailDrawer';

export interface OverviewPageProps {
  dataService: DataService;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

// Concise threat class display labels without altering authoritative backend values
function getShortThreatLabel(fullThreatClass: string): string {
  const tc = (fullThreatClass || '').toLowerCase();
  if (tc.includes('ddos') || tc.includes('volumetric')) return 'DDoS / Volumetric';
  if (tc.includes('botnet') || tc.includes('beacon') || tc.includes('c2')) return 'Botnet C2';
  if (tc.includes('dga') || tc.includes('dns')) return 'DGA / DNS Tunnel';
  if (tc.includes('encrypted') || tc.includes('malware')) return 'Encrypted Malware';
  if (tc.includes('recon') || tc.includes('scan')) return 'Recon / Port Scan';
  if (tc.includes('exfiltration') || tc.includes('data')) return 'Data Exfiltration';
  return fullThreatClass;
}

// Custom Tooltip popover inspired by dark network command center aesthetic
const CustomThreatTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-[#1b2433] bg-[#090d14] p-3 shadow-2xl text-xs font-sans space-y-1.5">
        <div className="flex items-center gap-2 border-b border-[#1b2433] pb-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="font-semibold text-slate-100 font-mono text-[11px]">{data.name}</span>
        </div>
        <div className="text-slate-300 text-[11px]">
          Class: <span className="font-medium text-slate-200">{data.fullName}</span>
        </div>
        <div className="text-cyan-400 font-mono font-bold text-xs pt-0.5">
          Detections: {data.count} {data.count === 1 ? 'alert' : 'alerts'}
        </div>
      </div>
    );
  }
  return null;
};

export const OverviewPage: FC<OverviewPageProps> = ({ dataService }) => {
  const [dataState, setDataState] = useState<DataState>('loading');
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [health, setHealth] = useState<PipelineHealthStatus | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<PaginatedResponse<ThreatAlert> | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    setDataState('loading');
    try {
      const [overviewData, healthData, alertsData] = await Promise.all([
        dataService.getOverviewMetrics(),
        dataService.getPipelineHealth(),
        dataService.getAlerts({ page: 1, limit: 5 }),
      ]);

      setMetrics(overviewData);
      setHealth(healthData);
      setRecentAlerts(alertsData);
      setDataState('ready');
    } catch {
      setDataState('error');
    }
  }, [dataService]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const handleInspectAlert = (alert: ThreatAlert) => {
    setSelectedAlert(alert);
    setIsDrawerOpen(true);
  };

  // Process Threat Class Distribution for Recharts Horizontal Bar Chart
  const threatChartData = metrics
    ? Object.entries(metrics.threat_counts_by_class)
        .map(([threatClass, count]) => ({
          fullName: threatClass,
          name: getShortThreatLabel(threatClass),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  // Calculate severity proportions
  const totalAlerts = metrics?.total_alerts || 0;
  const criticalPct = totalAlerts > 0 ? ((metrics?.critical_alerts || 0) / totalAlerts) * 100 : 0;
  const highPct = totalAlerts > 0 ? ((metrics?.high_alerts || 0) / totalAlerts) * 100 : 0;
  const mediumPct = totalAlerts > 0 ? ((metrics?.medium_alerts || 0) / totalAlerts) * 100 : 0;
  const lowPct = totalAlerts > 0 ? ((metrics?.low_alerts || 0) / totalAlerts) * 100 : 0;

  return (
    <div className="space-y-7">
      {/* 1. Command Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#1b2433]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 font-mono uppercase">
              UniThreat AI — Security Operations Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Passive Unidirectional IP Traffic Monitoring & AI Threat Intelligence Console
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 text-xs font-mono text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[10px] tracking-wide">PASSIVE INGEST — READ ONLY</span>
          </div>
          {health && <StatusPill status={health.pipeline_status} size="sm" />}
          {health && <StatusPill status={health.ingest_mode} size="sm" />}
        </div>
      </header>

      <DataStateWrapper state={dataState} onRetry={fetchOverviewData}>
        {metrics && health && recentAlerts && (
          <motion.div
            className="space-y-7"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 2. Primary Security Signals & Operational Rail */}
            <motion.section variants={itemVariants} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hero Readout 1: Total Threat Detections */}
                <div className="rounded-lg bg-[#0c1017] p-4.5 border border-[#1b2433] border-l-4 border-l-rose-500 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-sans text-slate-400">
                    <span className="font-mono uppercase font-semibold text-slate-300 text-[11px] tracking-wider">
                      Total Threat Detections
                    </span>
                    <Bell className="h-4 w-4 text-rose-400 shrink-0" />
                  </div>
                  <div className="my-2.5 flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
                      {metrics.total_alerts}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900/50 font-semibold text-[11px]">
                        Critical: {metrics.critical_alerts}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-950/50 text-orange-300 border border-orange-900/50 font-semibold text-[11px]">
                        High: {metrics.high_alerts}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Authoritative detection engine threat observations
                  </span>
                </div>

                {/* Hero Readout 2: Current Ingest Velocity */}
                <div className="rounded-lg bg-[#0c1017] p-4.5 border border-[#1b2433] border-l-4 border-l-cyan-500 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-sans text-slate-400">
                    <span className="font-mono uppercase font-semibold text-slate-300 text-[11px] tracking-wider">
                      Current Ingest Velocity
                    </span>
                    <Radio className="h-4 w-4 text-cyan-400 shrink-0" />
                  </div>
                  <div className="my-2.5 flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono tracking-tight">
                      {metrics.flows_per_second} <span className="text-base font-normal text-slate-400">/s</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-[11px] font-mono font-semibold">
                      FLOW INGEST RATE
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Monitored passive flow ingress per second
                  </span>
                </div>
              </div>

              {/* Compact Secondary Operational Rail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md bg-[#121824]/40 border border-[#1b2433] px-4 py-2.5 text-xs font-sans">
                <div className="flex items-center gap-2.5">
                  <Network className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Total Flows:</span>
                  <span className="font-bold text-slate-200 font-mono ml-auto sm:ml-0">
                    {metrics.total_flows.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Active Source IPs:</span>
                  <span className="font-bold text-slate-200 font-mono ml-auto sm:ml-0">
                    {metrics.active_source_ips.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Active Dest IPs:</span>
                  <span className="font-bold text-slate-200 font-mono ml-auto sm:ml-0">
                    {metrics.active_destination_ips.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.section>

            {/* 3. Threat Classification Surface (Reference-Inspired) & Severity Breakout */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Threat Class Bar Chart (Spacious Visualization-First Surface) */}
              <div className="lg:col-span-2 rounded-xl bg-[#0c1017] p-5 border border-[#1b2433] space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#1b2433]">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-cyan-400 shrink-0" />
                      <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                        THREAT CLASS DISTRIBUTION
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Authoritative threat observations by detected class
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-[#121824] px-2.5 py-1 rounded border border-slate-800/80 self-start sm:self-auto">
                    Backend Intelligence
                  </span>
                </div>

                {/* Recharts BarChart with Gridlines & End Counts (Matching Reference Quality) */}
                <div className="h-60 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={threatChartData}
                      margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid stroke="#1b2433" strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        allowDecimals={false}
                        axisLine={{ stroke: '#1b2433' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1b2433' }}
                        width={145}
                      />
                      <Tooltip content={<CustomThreatTooltip />} cursor={{ fill: '#121824', opacity: 0.6 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                        {threatChartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#06b6d4' : index === 1 ? '#0284c7' : '#0369a1'}
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="right"
                          fill="#06b6d4"
                          fontSize={11}
                          fontFamily="monospace"
                          fontWeight="bold"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-[#1b2433]/60">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Categorical Threat Density
                  </span>
                  <span>Authoritative Sensor Stream</span>
                </div>
              </div>

              {/* Refined Severity Breakout (Proportional Rail + Aligned Values) */}
              <div className="rounded-xl bg-[#0c1017] p-5 border border-[#1b2433] space-y-4 flex flex-col justify-between shadow-sm">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#1b2433]/80 pb-3">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                      Severity Breakout
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      Total: {totalAlerts}
                    </span>
                  </div>

                  {/* Proportional Stacked Rail */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                      <span>Proportional Distribution</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded bg-slate-900 border border-slate-800">
                      {criticalPct > 0 && (
                        <div
                          style={{ width: `${criticalPct}%` }}
                          className="bg-rose-500 transition-all duration-300"
                          title={`Critical: ${metrics.critical_alerts}`}
                        />
                      )}
                      {highPct > 0 && (
                        <div
                          style={{ width: `${highPct}%` }}
                          className="bg-orange-500 transition-all duration-300"
                          title={`High: ${metrics.high_alerts}`}
                        />
                      )}
                      {mediumPct > 0 && (
                        <div
                          style={{ width: `${mediumPct}%` }}
                          className="bg-amber-500 transition-all duration-300"
                          title={`Medium: ${metrics.medium_alerts}`}
                        />
                      )}
                      {lowPct > 0 && (
                        <div
                          style={{ width: `${lowPct}%` }}
                          className="bg-slate-500 transition-all duration-300"
                          title={`Low: ${metrics.low_alerts}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Aligned Severity Rows */}
                  <div className="space-y-2 pt-1 text-xs font-sans">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-rose-950/20 border border-rose-900/30">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                        <span className="font-semibold text-rose-300 uppercase text-[11px]">Critical</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-rose-200">{metrics.critical_alerts}</span>
                        <span className="text-[10px] text-rose-400/80">({criticalPct.toFixed(0)}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-orange-950/20 border border-orange-900/30">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
                        <span className="font-semibold text-orange-300 uppercase text-[11px]">High</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-orange-200">{metrics.high_alerts}</span>
                        <span className="text-[10px] text-orange-400/80">({highPct.toFixed(0)}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-amber-950/20 border border-amber-900/30">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                        <span className="font-semibold text-amber-300 uppercase text-[11px]">Medium</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-amber-200">{metrics.medium_alerts}</span>
                        <span className="text-[10px] text-amber-400/80">({mediumPct.toFixed(0)}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/20 border border-slate-700/30">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                        <span className="font-semibold text-slate-300 uppercase text-[11px]">Low</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-200">{metrics.low_alerts}</span>
                        <span className="text-[10px] text-slate-400">({lowPct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 4. Priority Recent Threat Observations (Elevated Position!) */}
            <motion.section variants={itemVariants} className="rounded-lg bg-[#0c1017] p-5 border border-[#1b2433] space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b2433]/80 pb-2.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Priority Recent Threat Observations
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Actionable passive threat detections requiring analyst triage
                  </p>
                </div>
                <Link
                  to="/alerts"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 font-sans hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View All Threat Observations ({metrics.total_alerts})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentAlerts.data.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-sans">
                  No recent threat alerts observed.
                </div>
              ) : (
                <div className="overflow-x-auto focus-ring rounded border border-slate-800/80" role="region" aria-label="Recent Threat Observations Dataset" tabIndex={0}>
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#121824] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#1b2433]">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Threat Class</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Flow ID</th>
                        <th className="py-2.5 px-3">Source IP</th>
                        <th className="py-2.5 px-3">Destination IP</th>
                        <th className="py-2.5 px-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#0c1017]">
                      {recentAlerts.data.map((alert) => (
                        <tr
                          key={`${alert.flow_id}-${alert.timestamp}-${alert.threat_class}`}
                          className="hover:bg-[#121824] transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {alert.timestamp}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <SeverityBadge severity={alert.severity} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <ThreatClassBadge threatClass={alert.threat_class} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <ConfidenceGauge confidence={alert.confidence} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <Link
                              to={`/alerts/flow/${alert.flow_id}`}
                              className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                              title={`Inspect flow ${alert.flow_id}`}
                            >
                              {alert.flow_id}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {alert.source_ip || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {alert.destination_ip || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleInspectAlert(alert)}
                              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white focus-ring font-mono transition-colors"
                              title="Inspect evidence details"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            {/* 5. Ingest Telemetry & Data Gap Notice Surface */}
            <motion.section variants={itemVariants} className="space-y-3.5">
              {/* Compact Pipeline Telemetry Strip */}
              <div className="rounded-lg bg-[#0c1017] p-4.5 border border-[#1b2433] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b2433]/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-cyan-400" />
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      Pipeline Telemetry Status
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={health.pipeline_status} size="sm" />
                    <StatusPill status={health.ingest_mode} size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="rounded border border-slate-800 bg-[#121824]/50 p-2.5">
                    <span className="text-slate-400 block text-[11px] font-sans">
                      Ingest Velocity
                    </span>
                    <span className="text-slate-100 font-bold mt-0.5 block">
                      {health.flows_per_second !== undefined ? `${health.flows_per_second} /s` : 'N/A'}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#121824]/50 p-2.5">
                    <span className="text-slate-400 block text-[11px] font-sans">
                      Ring Buffer Usage
                    </span>
                    <span className="text-slate-100 font-bold mt-0.5 block">
                      {health.buffer_usage_percentage !== undefined ? `${health.buffer_usage_percentage}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#121824]/50 p-2.5">
                    <span className="text-slate-400 block text-[11px] font-sans">
                      Packets Dropped
                    </span>
                    <span className="text-slate-100 font-bold mt-0.5 block">
                      {health.packets_dropped !== undefined ? health.packets_dropped : 'N/A'}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#121824]/50 p-2.5">
                    <span className="text-slate-400 block text-[11px] font-sans">
                      Last Sensor Sync
                    </span>
                    <span className="text-slate-100 text-[11px] font-bold mt-0.5 block truncate">
                      {health.last_updated || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Threat Activity Timeline (Data Gap Notice) */}
              <div className="rounded-md border border-[#1b2433] bg-[#0c1017] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-300 font-mono uppercase text-[11px]">
                    Threat Activity Timeline:
                  </span>
                  <span className="text-slate-400 font-sans text-[11px]">
                    Historical time-series telemetry unavailable from sensor interface
                  </span>
                </div>
                <span className="inline-flex items-center rounded border border-slate-700/60 bg-[#121824] px-2 py-0.5 text-[10px] font-mono text-slate-400 self-start sm:self-auto">
                  BACKEND/API REQUIREMENT — NOT CURRENTLY DEFINED
                </span>
              </div>
            </motion.section>
          </motion.div>
        )}
      </DataStateWrapper>

      {/* Alert Detail Inspector Drawer */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

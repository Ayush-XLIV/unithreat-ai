import type { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader } from '../components/layout/PageHeader';
import { OverviewPage } from '../pages/OverviewPage';
import { AlertsPage } from '../pages/AlertsPage';
import { FlowsPage } from '../pages/FlowsPage';
import { FlowInvestigationPage } from '../pages/FlowInvestigationPage';
import { mockDataService } from '../services/MockDataService';

/** Helper component for temporary placeholder pages */
const PlaceholderPage: FC<{
  title: string;
  description: string;
  phase: string;
}> = ({ title, description, phase }) => {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-full bg-slate-800/80 p-3 text-slate-400 border border-slate-700/50">
            <span className="font-mono text-sm font-semibold text-cyan-400">
              {phase}
            </span>
          </div>
          <h2 className="text-base font-semibold text-slate-200">
            {title} View Placeholder
          </h2>
          <p className="mt-1 max-w-md text-xs text-slate-400 font-sans">
            This operational view is defined in the SOC Console architecture and
            is scheduled for full DataService implementation in {phase}.
          </p>
          <div className="mt-4 inline-flex items-center rounded border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] font-mono text-slate-400">
            STATUS: PLANNED / ARCHITECTURAL PLACEHOLDER
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppRoutes: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Redirect root path to /overview */}
        <Route index element={<Navigate to="/overview" replace />} />

        {/* 7 Primary Navigation Views */}
        <Route path="overview" element={<OverviewPage dataService={mockDataService} />} />
        <Route path="alerts" element={<AlertsPage dataService={mockDataService} />} />
        <Route path="flows" element={<FlowsPage dataService={mockDataService} />} />
        <Route
          path="threat-analysis"
          element={
            <PlaceholderPage
              title="Threat Analysis"
              description="Threat class distributions and backend security intelligence summaries."
              phase="Phase 5F"
            />
          }
        />
        <Route
          path="analytics"
          element={
            <PlaceholderPage
              title="Detection Analytics"
              description="Pipeline throughput metrics, flow velocity, and protocol distribution."
              phase="Phase 5F"
            />
          }
        />
        <Route
          path="ml-intelligence"
          element={
            <PlaceholderPage
              title="ML Intelligence"
              description="ML prediction model score distributions and model version inspection."
              phase="Phase 5F"
            />
          }
        />
        <Route
          path="system-health"
          element={
            <PlaceholderPage
              title="System Monitoring"
              description="Passive ingest pipeline telemetry, buffer usage, and operational status."
              phase="Phase 5F"
            />
          }
        />

        {/* 2 Contextual Investigation Routes */}
        <Route path="alerts/flow/:flowId" element={<FlowInvestigationPage dataService={mockDataService} />} />
        <Route path="flows/:flowId" element={<FlowInvestigationPage dataService={mockDataService} />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
};

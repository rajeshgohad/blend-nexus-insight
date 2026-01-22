import { Cpu, Wrench, TrendingUp, Eye, Calendar } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { UseCaseCard } from '@/components/dashboard/UseCaseCard';
import { DigitalTwin } from '@/components/dashboard/DigitalTwin';
import { PredictiveMaintenance } from '@/components/dashboard/PredictiveMaintenance';
import { YieldOptimization } from '@/components/dashboard/YieldOptimization';
import { ComputerVision } from '@/components/dashboard/ComputerVision';
import { BatchScheduling } from '@/components/dashboard/BatchScheduling';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { AlertFeed } from '@/components/dashboard/AlertFeed';
import { useSimulation } from '@/hooks/useSimulation';

const Index = () => {
  const {
    simulation,
    parameters,
    batch,
    components,
    anomalies,
    yieldHistory,
    recommendations,
    detections,
    schedule,
    resources,
    alerts,
    rftPercentage,
    learningProgress,
    actions,
  } = useSimulation();

  const isRunning = batch.state === 'blending' || batch.state === 'loading';
  const hasWarnings = anomalies.some(a => a.severity === 'high') || detections.some(d => d.severity === 'critical');

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header 
        productionLine="Production Line PL-01 | V-Blender VB-500"
        currentTime={simulation.currentTime}
        batchState={batch.state}
        isConnected={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full min-h-[800px]">
            {/* Digital Twin - Takes more space */}
            <UseCaseCard
              title="Digital Process Twin"
              subtitle="Blending Process Visualization"
              icon={<Cpu className="w-5 h-5" />}
              status={batch.state === 'emergency-stop' ? 'error' : isRunning ? 'active' : 'idle'}
              className="xl:row-span-1"
            >
              <DigitalTwin
                parameters={parameters}
                batch={batch}
                onStart={actions.startBatch}
                onStop={actions.stopBatch}
                onSuspend={actions.suspendBatch}
                onResume={actions.resumeBatch}
                onEmergencyStop={actions.emergencyStop}
                onEmergencyReset={actions.emergencyReset}
              />
            </UseCaseCard>

            {/* Predictive Maintenance */}
            <UseCaseCard
              title="Predictive Maintenance"
              subtitle="Autonomous Equipment Health"
              icon={<Wrench className="w-5 h-5" />}
              status={components.some(c => c.health < 60) ? 'warning' : 'active'}
              className="xl:row-span-1"
            >
              <PredictiveMaintenance
                components={components}
                anomalies={anomalies}
                vibration={parameters.vibration}
                motorLoad={parameters.motorLoad}
                temperature={parameters.temperature}
              />
            </UseCaseCard>

            {/* Yield Optimization */}
            <UseCaseCard
              title="Yield Optimization"
              subtitle="Reinforcement Learning Engine"
              icon={<TrendingUp className="w-5 h-5" />}
              status={isRunning ? 'active' : 'idle'}
              className="xl:row-span-1"
            >
              <YieldOptimization
                yieldHistory={yieldHistory}
                recommendations={recommendations}
                learningProgress={learningProgress}
                currentYield={parameters.blendUniformity > 0 ? 92 + (parameters.blendUniformity / 100) * 6 : 0}
                targetYield={95}
                onApproveRecommendation={actions.approveRecommendation}
              />
            </UseCaseCard>

            {/* Computer Vision */}
            <UseCaseCard
              title="Computer Vision QC"
              subtitle="Real-time Visual Monitoring"
              icon={<Eye className="w-5 h-5" />}
              status={detections.some(d => d.severity === 'critical') ? 'warning' : 'active'}
              className="xl:row-span-1"
            >
              <ComputerVision
                detections={detections}
                rftPercentage={rftPercentage}
              />
            </UseCaseCard>

            {/* Batch Scheduling */}
            <UseCaseCard
              title="Batch Scheduling"
              subtitle="Self-Optimizing Production"
              icon={<Calendar className="w-5 h-5" />}
              status="active"
              className="lg:col-span-2 xl:col-span-2"
            >
              <BatchScheduling
                schedule={schedule}
                resources={resources}
              />
            </UseCaseCard>
          </div>
        </div>

        {/* Control Panel Sidebar */}
        <div className="w-64 shrink-0 no-print">
          <ControlPanel
            simulation={simulation}
            onSpeedChange={actions.setSpeed}
            onTogglePause={actions.togglePause}
            onReset={actions.resetSimulation}
            onInjectScenario={actions.injectScenario}
          />
        </div>
      </div>

      {/* Alert Feed */}
      <AlertFeed alerts={alerts} />
    </div>
  );
};

export default Index;

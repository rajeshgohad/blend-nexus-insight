import { Cpu, Wrench, TrendingUp, Eye, Calendar, ClipboardList } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { UseCaseCard } from '@/components/dashboard/UseCaseCard';
import { DigitalTwin } from '@/components/dashboard/DigitalTwin';
import { PredictiveMaintenance } from '@/components/dashboard/PredictiveMaintenance';
import { YieldOptimization } from '@/components/dashboard/YieldOptimization';
import { ComputerVision } from '@/components/dashboard/ComputerVision';
import { BatchScheduling } from '@/components/dashboard/BatchScheduling';
import { BatchOrders } from '@/components/dashboard/BatchOrders';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { AlertFeed } from '@/components/dashboard/AlertFeed';
import { useSimulation } from '@/hooks/useSimulation';
import { useMaintenanceWorkflow } from '@/hooks/useMaintenanceWorkflow';
import { useTabletPressYield } from '@/hooks/useTabletPressYield';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    simulation,
    parameters,
    batch,
    components,
    anomalies,
    detections,
    schedule,
    resources,
    alerts,
    rftPercentage,
    availableRecipes,
    parameterHistory,
    actions,
  } = useSimulation();

  const {
    technicians,
    spares,
    workOrders,
    purchaseOrders,
    maintenanceDecisions,
    maintenanceLogs,
    processMaintenanceDecision,
  } = useMaintenanceWorkflow(components, schedule, anomalies);

  // Check if tablet press is active (discharge completed)
  const dischargeStep = batch.blendingSequence.find(s => s.step === 'discharge');
  const isTabletPressActive = dischargeStep?.status === 'completed';

  const {
    signals: yieldSignals,
    batchProfile,
    driftDetections,
    prediction,
    recommendations: yieldRecommendations,
    yieldHistory,
    learningProgress,
    parameterTrend,
    approveRecommendation: approveYieldRecommendation,
  } = useTabletPressYield(isTabletPressActive, simulation.isPaused);

  const isRunning = batch.state === 'blending' || batch.state === 'loading';

  const useCases = [
    {
      id: 'digital-twin',
      label: 'Digital Twin',
      icon: <Cpu className="w-4 h-4" />,
      title: 'Digital Process Twin',
      subtitle: 'Blending Process Visualization',
      status: batch.state === 'emergency-stop' ? 'error' : isRunning ? 'active' : 'idle',
      content: (
        <DigitalTwin
          parameters={parameters}
          batch={batch}
          availableRecipes={availableRecipes}
          parameterHistory={parameterHistory}
          onStart={actions.startBatch}
          onStop={actions.stopBatch}
          onSuspend={actions.suspendBatch}
          onResume={actions.resumeBatch}
          onEmergencyStop={actions.emergencyStop}
          onEmergencyReset={actions.emergencyReset}
          onSelectRecipe={actions.selectRecipe}
        />
      ),
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench className="w-4 h-4" />,
      title: 'Predictive Maintenance',
      subtitle: 'Autonomous Equipment Health',
      status: components.some(c => c.health < 60) ? 'warning' : 'active',
      content: (
        <PredictiveMaintenance
          components={components}
          anomalies={anomalies}
          vibration={parameters.vibration}
          motorLoad={parameters.motorLoad}
          temperature={parameters.temperature}
          technicians={technicians}
          spares={spares}
          workOrders={workOrders}
          purchaseOrders={purchaseOrders}
          maintenanceDecisions={maintenanceDecisions}
          maintenanceLogs={maintenanceLogs}
          onTriggerAnalysis={processMaintenanceDecision}
        />
      ),
    },
    {
      id: 'yield',
      label: 'Yield',
      icon: <TrendingUp className="w-4 h-4" />,
      title: 'Yield Optimization',
      subtitle: 'Tablet Compression AI',
      status: isTabletPressActive ? (driftDetections.length > 0 ? 'warning' : 'active') : 'idle',
      content: (
        <YieldOptimization
          signals={yieldSignals}
          batchProfile={batchProfile}
          driftDetections={driftDetections}
          prediction={prediction}
          recommendations={yieldRecommendations}
          yieldHistory={yieldHistory}
          learningProgress={learningProgress}
          isTabletPressActive={isTabletPressActive}
          parameterTrend={parameterTrend}
          onApproveRecommendation={approveYieldRecommendation}
        />
      ),
    },
    {
      id: 'vision',
      label: 'Vision QC',
      icon: <Eye className="w-4 h-4" />,
      title: 'Computer Vision QC',
      subtitle: 'Real-time Visual Monitoring',
      status: detections.some(d => d.severity === 'critical') ? 'warning' : 'active',
      content: (
        <ComputerVision
          detections={detections}
          rftPercentage={rftPercentage}
        />
      ),
    },
    {
      id: 'scheduling',
      label: 'Scheduling',
      icon: <Calendar className="w-4 h-4" />,
      title: 'Batch Scheduling',
      subtitle: 'Self-Optimizing Production',
      status: 'active' as const,
      content: (
        <BatchScheduling
          schedule={schedule}
          resources={resources}
        />
      ),
    },
    {
      id: 'batch-orders',
      label: 'Batch Orders',
      icon: <ClipboardList className="w-4 h-4" />,
      title: 'Batch Orders',
      subtitle: 'Master Production Schedule',
      status: 'active' as const,
      content: <BatchOrders />,
    },
  ];

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
        {/* Tabbed Dashboard */}
        <div className="flex-1 p-4 overflow-hidden">
          <Tabs defaultValue="digital-twin" className="h-full flex flex-col">
            <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 h-auto flex-wrap">
              {useCases.map((uc) => (
                <TabsTrigger
                  key={uc.id}
                  value={uc.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                >
                  {uc.icon}
                  <span className="hidden sm:inline">{uc.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {useCases.map((uc) => (
              <TabsContent key={uc.id} value={uc.id} className="flex-1 mt-4 overflow-hidden">
                <UseCaseCard
                  title={uc.title}
                  subtitle={uc.subtitle}
                  icon={uc.icon}
                  status={uc.status as 'active' | 'idle' | 'warning' | 'error'}
                  className="h-full"
                >
                  {uc.content}
                </UseCaseCard>
              </TabsContent>
            ))}
          </Tabs>
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

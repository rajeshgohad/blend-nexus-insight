import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Zap, Target, Activity, Scale, Gauge, Wind, ArrowRight, ShieldCheck, Clock, LineChart, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DriftTrendDialog } from './DriftTrendDialog';
import { ApprovalDialog, type ApprovalRole } from './ApprovalDialog';
import type { 
  TabletPressSignals, 
  BatchProfile, 
  DriftDetection, 
  OutcomePrediction, 
  YieldRecommendation,
  YieldHistoryPoint,
  ParameterTrendPoint,
} from '@/types/tablet-press-yield';

// Helper to determine required approval role based on variation
function getRequiredApprovalRole(currentValue: number, recommendedValue: number): ApprovalRole | null {
  const variation = Math.abs(recommendedValue - currentValue);
  
  if (variation > 0.8) {
    return 'recipe_manager'; // High variation requires Recipe Manager
  } else if (variation >= 0.1 && variation <= 0.3) {
    return 'supervisor'; // Medium variation requires Supervisor
  }
  return null; // Low variation - no approval needed
}

interface YieldOptimizationProps {
  signals: TabletPressSignals;
  batchProfile: BatchProfile;
  driftDetections: DriftDetection[];
  prediction: OutcomePrediction;
  recommendations: YieldRecommendation[];
  yieldHistory: YieldHistoryPoint[];
  learningProgress: { episodes: number; reward: number };
  isTabletPressActive: boolean;
  parameterTrend: ParameterTrendPoint[];
  onApproveRecommendation: (id: string) => void;
}

function SignalCard({ label, value, unit, icon: Icon, status = 'normal' }: {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  status?: 'normal' | 'warning' | 'critical';
}) {
  const statusColors = {
    normal: 'text-primary',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${statusColors[status]}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className={`text-lg font-bold ${statusColors[status]}`}>
          {value.toFixed(1)} <span className="text-xs font-normal">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function MiniYieldChart({ data }: { data: YieldHistoryPoint[] }) {
  if (data.length === 0) return null;
  
  const maxYield = Math.max(...data.map(d => Math.max(d.actualYield, d.predictedYield)));
  const minYield = Math.min(...data.map(d => Math.min(d.actualYield, d.predictedYield)));
  const range = maxYield - minYield || 1;

  return (
    <div className="h-20 flex items-end gap-1">
      {data.slice(-12).map((d, idx) => {
        const actualHeight = ((d.actualYield - minYield) / range) * 100;
        const predictedHeight = ((d.predictedYield - minYield) / range) * 100;
        
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 relative group">
            <div 
              className="absolute bottom-0 w-full bg-primary/20 rounded-t"
              style={{ height: `${predictedHeight}%` }}
            />
            <div 
              className="relative w-full bg-primary rounded-t transition-all hover:bg-primary/80"
              style={{ height: `${actualHeight}%` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <div>Actual: {d.actualYield.toFixed(1)}%</div>
              <div>Target: {d.target}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DriftAlert({ drift, onSeeTrend }: { drift: DriftDetection; onSeeTrend: () => void }) {
  const severityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/20 text-warning border-warning/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[drift.severity]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          {drift.direction === 'increasing' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium capitalize">{drift.parameter}</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {drift.direction} {drift.magnitude.toFixed(1)}%
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-xs gap-1 hover:bg-primary/10"
          onClick={onSeeTrend}
        >
          <LineChart className="w-3.5 h-3.5" />
          See Trend
        </Button>
      </div>
      <p className="text-xs mt-1.5 opacity-80">{drift.description}</p>
    </div>
  );
}

function RecommendationCard({ 
  rec, 
  onApprove 
}: { 
  rec: YieldRecommendation; 
  onApprove: () => void;
}) {
  const requiredRole = getRequiredApprovalRole(rec.currentValue, rec.recommendedValue);
  const variation = Math.abs(rec.recommendedValue - rec.currentValue);

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      rec.approved 
        ? 'border-success/30 bg-success/10' 
        : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
    }`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={rec.riskLevel === 'low' ? 'secondary' : 'outline'} className="text-xs px-2 py-0.5">
            {rec.riskLevel === 'low' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
            {rec.riskLevel} risk
          </Badge>
          <span className="text-sm font-medium">{rec.parameter}</span>
          {requiredRole && !rec.approved && (
            <Badge 
              variant={requiredRole === 'recipe_manager' ? 'destructive' : 'default'} 
              className="text-[10px] px-1.5 py-0.5"
            >
              {requiredRole === 'recipe_manager' ? 'Recipe Mgr' : 'Supervisor'} ({variation.toFixed(2)} pts)
            </Badge>
          )}
        </div>
        {rec.approved ? (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Applied</span>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="default" 
            className="h-8 px-4 text-sm"
            onClick={onApprove}
          >
            Approve
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-3 text-sm mb-2">
        <span className="text-muted-foreground font-mono">{rec.currentValue.toFixed(1)}</span>
        <ArrowRight className="w-4 h-4 text-primary" />
        <span className="font-bold text-primary font-mono text-base">{rec.recommendedValue.toFixed(1)}</span>
        <span className="text-muted-foreground">{rec.unit}</span>
        <Badge variant="outline" className="text-xs px-2 py-0.5 text-success">
          {rec.adjustment}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex-1">{rec.reasoning}</p>
        <div className="flex items-center gap-2 ml-3 bg-success/15 rounded-lg px-3 py-1.5 border border-success/30">
          <TrendingUp className="w-5 h-5 text-success" />
          <span className="text-base font-bold text-success">+{rec.expectedImprovement.toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <span>SOP range: {rec.sopMin} - {rec.sopMax} {rec.unit}</span>
      </div>
    </div>
  );
}

export function YieldOptimization({ 
  signals,
  batchProfile,
  driftDetections,
  prediction,
  recommendations,
  yieldHistory,
  learningProgress,
  isTabletPressActive,
  parameterTrend,
  onApproveRecommendation 
}: YieldOptimizationProps) {
  const [selectedDrift, setSelectedDrift] = useState<DriftDetection | null>(null);
  const [trendDialogOpen, setTrendDialogOpen] = useState(false);
  
  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pendingApprovalRec, setPendingApprovalRec] = useState<YieldRecommendation | null>(null);

  const handleSeeTrend = (drift: DriftDetection) => {
    setSelectedDrift(drift);
    setTrendDialogOpen(true);
  };

  const handleApproveClick = (rec: YieldRecommendation) => {
    const requiredRole = getRequiredApprovalRole(rec.currentValue, rec.recommendedValue);
    
    if (requiredRole) {
      // Requires authorization - show dialog
      setPendingApprovalRec(rec);
      setApprovalDialogOpen(true);
    } else {
      // No authorization needed - approve directly
      onApproveRecommendation(rec.id);
    }
  };

  const handleApprovalConfirmed = () => {
    if (pendingApprovalRec) {
      onApproveRecommendation(pendingApprovalRec.id);
      setPendingApprovalRec(null);
    }
  };
  
  if (!isTabletPressActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Activity className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Tablet Press Standby</h3>
        <p className="text-base text-muted-foreground max-w-md">
          Yield optimization will activate once the blending discharge step is complete and the tablet press begins operation.
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span>Waiting for tablet press activation...</span>
        </div>
      </div>
    );
  }

  const pendingRecommendations = recommendations.filter(r => !r.approved);
  const approvedRecommendations = recommendations.filter(r => r.approved);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        {/* Real-time Signals Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Real-time Tablet Press Signals</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <SignalCard label="Weight" value={signals.weight} unit="mg" icon={Scale} />
            <SignalCard label="Thickness" value={signals.thickness} unit="mm" icon={Gauge} />
            <SignalCard label="Hardness" value={signals.hardness} unit="kP" icon={Zap} />
            <SignalCard label="Turret" value={signals.turretSpeed} unit="rpm" icon={Activity} />
            <SignalCard label="Feeder" value={signals.feederSpeed} unit="rpm" icon={Wind} />
            <SignalCard label="Vacuum" value={signals.vacuum} unit="mbar" icon={Wind} />
            <SignalCard label="Pre-Comp" value={signals.preCompressionForce} unit="kN" icon={Target} />
            <SignalCard label="Main-Comp" value={signals.mainCompressionForce} unit="kN" icon={Target} />
          </div>
        </div>

        {/* Batch Profile */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30 border-0">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Current Batch Profile</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Avg Weight</div>
                <div className="text-lg font-bold">{batchProfile.avgWeight.toFixed(1)} mg</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Weight %RSD</div>
                <div className={`text-lg font-bold ${batchProfile.weightRSD > 2 ? 'text-warning' : 'text-success'}`}>
                  {batchProfile.weightRSD.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">In-Spec Rate</div>
                <div className={`text-lg font-bold ${batchProfile.inSpecPercentage < 98 ? 'text-warning' : 'text-success'}`}>
                  {batchProfile.inSpecPercentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rejects/min</div>
                <div className={`text-lg font-bold ${batchProfile.rejectRate > 5 ? 'text-destructive' : batchProfile.rejectRate > 2 ? 'text-warning' : 'text-foreground'}`}>
                  {batchProfile.rejectRate.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tablets Produced</span>
                <span className="font-mono font-medium">{batchProfile.tabletsProduced.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-mono font-medium">{batchProfile.tabletsPerMinute.toLocaleString()}/min</span>
              </div>
            </div>
          </Card>

          {/* Outcome Prediction */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">AI Outcome Prediction</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5 ml-auto">
                {(prediction.confidenceLevel * 100).toFixed(0)}% conf
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current trajectory</span>
                <span className={`text-xl font-bold ${prediction.currentYield < 95 ? 'text-warning' : ''}`}>
                  {prediction.currentYield.toFixed(1)}% yield
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">With corrections</span>
                <span className="text-xl font-bold text-success">
                  {prediction.correctedYield.toFixed(1)}% yield
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential improvement</span>
                <Badge variant="secondary" className="text-success font-bold text-base px-3 py-1">
                  +{recommendations.reduce((sum, r) => sum + r.expectedImprovement, 0).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Drift Detection - Hidden per user request */}

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">AI Micro-Adjustments</span>
            {pendingRecommendations.length > 0 && (
              <Badge variant="default" className="text-xs px-2 py-0.5">
                {pendingRecommendations.length} pending
              </Badge>
            )}
          </div>
          <div className="grid gap-3">
            {recommendations.slice(0, 4).map((rec) => (
              <RecommendationCard 
                key={rec.id} 
                rec={rec}
                onApprove={() => handleApproveClick(rec)}
              />
            ))}
          </div>
        </div>

        {/* Yield History & RL Model Status - Hidden per user request */}

        {/* Data input indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span>Receiving real-time data from Tablet Press</span>
        </div>
      </div>

      {/* Drift Trend Dialog */}
      <DriftTrendDialog
        open={trendDialogOpen}
        onOpenChange={setTrendDialogOpen}
        drift={selectedDrift}
        trendData={parameterTrend}
      />

      {/* Approval Dialog */}
      {pendingApprovalRec && (
        <ApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          requiredRole={getRequiredApprovalRole(pendingApprovalRec.currentValue, pendingApprovalRec.recommendedValue)!}
          variation={Math.abs(pendingApprovalRec.recommendedValue - pendingApprovalRec.currentValue)}
          parameterName={pendingApprovalRec.parameter}
          currentValue={pendingApprovalRec.currentValue}
          recommendedValue={pendingApprovalRec.recommendedValue}
          unit={pendingApprovalRec.unit}
          onApprove={handleApprovalConfirmed}
        />
      )}
    </ScrollArea>
  );
}

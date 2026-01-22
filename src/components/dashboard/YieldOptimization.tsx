import { Brain, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Zap, Target, Activity, Scale, Gauge, Wind, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { 
  TabletPressSignals, 
  BatchProfile, 
  DriftDetection, 
  OutcomePrediction, 
  YieldRecommendation,
  YieldHistoryPoint 
} from '@/types/tablet-press-yield';

interface YieldOptimizationProps {
  signals: TabletPressSignals;
  batchProfile: BatchProfile;
  driftDetections: DriftDetection[];
  prediction: OutcomePrediction;
  recommendations: YieldRecommendation[];
  yieldHistory: YieldHistoryPoint[];
  learningProgress: { episodes: number; reward: number };
  isTabletPressActive: boolean;
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

function DriftAlert({ drift }: { drift: DriftDetection }) {
  const severityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/20 text-warning border-warning/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[drift.severity]}`}>
      <div className="flex items-center gap-2">
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
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      rec.approved 
        ? 'border-success/30 bg-success/10' 
        : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
    }`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={rec.riskLevel === 'low' ? 'secondary' : 'outline'} className="text-xs px-2 py-0.5">
            {rec.riskLevel === 'low' ? <ShieldCheck className="w-3 h-3 mr-1" /> : null}
            {rec.riskLevel} risk
          </Badge>
          <span className="text-sm font-medium">{rec.parameter}</span>
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
        <div className="flex items-center gap-1.5 ml-3">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">+{rec.expectedImprovement.toFixed(2)}%</span>
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
  onApproveRecommendation 
}: YieldOptimizationProps) {
  
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
                <Badge variant="secondary" className="text-success text-sm px-2 py-0.5">
                  +{(prediction.correctedYield - prediction.currentYield).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Drift Detection */}
        {driftDetections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">Early Drift Detection</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {driftDetections.length} active
              </Badge>
            </div>
            <div className="grid gap-2">
              {driftDetections.slice(0, 3).map((drift) => (
                <DriftAlert key={drift.id} drift={drift} />
              ))}
            </div>
          </div>
        )}

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
                onApprove={() => onApproveRecommendation(rec.id)}
              />
            ))}
          </div>
        </div>

        {/* Yield History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Yield Trend (Last 12 Batches)</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-primary rounded" />
                <span className="text-xs text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-primary/30 rounded" />
                <span className="text-xs text-muted-foreground">Predicted</span>
              </div>
            </div>
          </div>
          <MiniYieldChart data={yieldHistory} />
        </div>

        {/* RL Model Status */}
        <Card className="p-4 bg-muted/30 border-0">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">RL Model Status</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Training Episodes</div>
              <div className="text-base font-mono">{learningProgress.episodes.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reward Score</div>
              <div className="flex items-center gap-2">
                <Progress value={learningProgress.reward * 100} className="h-2 flex-1" />
                <span className="text-sm font-mono">{(learningProgress.reward * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Data input indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span>Receiving real-time data from Tablet Press</span>
        </div>
      </div>
    </ScrollArea>
  );
}

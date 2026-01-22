import { Brain, TrendingUp, CheckCircle, XCircle, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { YieldData, ParameterRecommendation } from '@/types/manufacturing';

interface YieldOptimizationProps {
  yieldHistory: YieldData[];
  recommendations: ParameterRecommendation[];
  learningProgress: { episodes: number; reward: number };
  currentYield: number;
  targetYield: number;
  onApproveRecommendation: (parameter: string) => void;
}

function MiniChart({ data }: { data: YieldData[] }) {
  const maxYield = Math.max(...data.map(d => Math.max(d.actualYield, d.predictedYield)));
  const minYield = Math.min(...data.map(d => Math.min(d.actualYield, d.predictedYield)));
  const range = maxYield - minYield || 1;

  return (
    <div className="h-24 flex items-end gap-0.5">
      {data.slice(-15).map((d, idx) => {
        const actualHeight = ((d.actualYield - minYield) / range) * 100;
        const predictedHeight = ((d.predictedYield - minYield) / range) * 100;
        
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 relative group">
            {/* Predicted (background) */}
            <div 
              className="absolute bottom-0 w-full bg-primary/20 rounded-t"
              style={{ height: `${predictedHeight}%` }}
            />
            {/* Actual (foreground) */}
            <div 
              className="relative w-full bg-primary rounded-t transition-all hover:bg-primary/80"
              style={{ height: `${actualHeight}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <div>Actual: {d.actualYield.toFixed(1)}%</div>
              <div>Predicted: {d.predictedYield.toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationCard({ 
  rec, 
  onApprove 
}: { 
  rec: ParameterRecommendation; 
  onApprove: () => void;
}) {
  return (
    <div className={`p-2 rounded border ${rec.approved ? 'border-success/30 bg-success/10' : 'border-border bg-muted/30'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-medium">{rec.parameter}</span>
        {rec.approved ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2 text-[10px]"
            onClick={onApprove}
          >
            Approve
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-muted-foreground">{rec.currentValue}</span>
        <span className="text-primary">→</span>
        <span className="font-medium text-primary">{rec.recommendedValue}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingUp className="w-3 h-3 text-success" />
        <span className="text-[10px] text-success">+{rec.expectedImprovement.toFixed(1)}% yield</span>
      </div>
    </div>
  );
}

export function YieldOptimization({ 
  yieldHistory, 
  recommendations, 
  learningProgress,
  currentYield,
  targetYield,
  onApproveRecommendation 
}: YieldOptimizationProps) {
  const avgYield = yieldHistory.length > 0 
    ? yieldHistory.reduce((acc, d) => acc + d.actualYield, 0) / yieldHistory.length 
    : 0;
  const yieldGap = targetYield - avgYield;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Current Performance */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Target className="w-3 h-3" />
            Current Batch
          </div>
          <div className="text-xl font-bold text-primary">{currentYield.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">Target: {targetYield}%</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            Avg (20 batches)
          </div>
          <div className="text-xl font-bold">{avgYield.toFixed(1)}%</div>
          <div className={`text-[10px] ${yieldGap > 0 ? 'text-warning' : 'text-success'}`}>
            {yieldGap > 0 ? `-${yieldGap.toFixed(1)}%` : `+${Math.abs(yieldGap).toFixed(1)}%`} from target
          </div>
        </div>
      </div>

      {/* Yield History Chart */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Yield Trend (Last 15 Batches)</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded" />
              <span className="text-[10px] text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary/30 rounded" />
              <span className="text-[10px] text-muted-foreground">Predicted</span>
            </div>
          </div>
        </div>
        <MiniChart data={yieldHistory} />
      </div>

      {/* RL Learning Progress */}
      <div className="bg-primary/10 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">RL Model Status</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-muted-foreground">Episodes</div>
            <div className="text-sm font-mono">{learningProgress.episodes.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Reward Score</div>
            <div className="flex items-center gap-1">
              <Progress value={learningProgress.reward * 100} className="h-1.5 flex-1" />
              <span className="text-[10px] font-mono">{(learningProgress.reward * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-xs text-muted-foreground">AI Recommendations</span>
        </div>
        <div className="grid gap-2">
          {recommendations.slice(0, 2).map((rec, idx) => (
            <RecommendationCard 
              key={idx} 
              rec={rec} 
              onApprove={() => onApproveRecommendation(rec.parameter)}
            />
          ))}
        </div>
      </div>

      {/* Data input indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Receiving real-time blend data from Digital Twin</span>
      </div>
    </div>
  );
}

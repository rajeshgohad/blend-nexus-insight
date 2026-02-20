import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, UserCog, Lock, AlertTriangle } from 'lucide-react';

export type ApprovalRole = 'supervisor' | 'recipe_manager';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredRole: ApprovalRole;
  variation: number;
  parameterName: string;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  onApprove: () => void;
}

const ROLE_CONFIG = {
  supervisor: {
    title: 'Supervisor Approval Required',
    description: 'This adjustment requires supervisor authorization due to the variation magnitude within tolerance limits',
    icon: ShieldCheck,
    color: 'text-primary',
    badgeVariant: 'default' as const,
  },
  recipe_manager: {
    title: 'Recipe Manager Approval Required',
    description: "This adjustment requires Recipe Manager's authorization due to the variation magnitude outside tolerance limits",
    icon: UserCog,
    color: 'text-warning',
    badgeVariant: 'destructive' as const,
  },
};

// Mock credentials for demo
const VALID_CREDENTIALS: Record<ApprovalRole, { username: string; password: string }> = {
  supervisor: { username: 'supervisor', password: 'super123' },
  recipe_manager: { username: 'recipemanager', password: 'recipe123' },
};

export function ApprovalDialog({
  open,
  onOpenChange,
  requiredRole,
  variation,
  parameterName,
  currentValue,
  recommendedValue,
  unit,
  onApprove,
}: ApprovalDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const config = ROLE_CONFIG[requiredRole];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const validCreds = VALID_CREDENTIALS[requiredRole];
    if (username === validCreds.username && password === validCreds.password) {
      onApprove();
      onOpenChange(false);
      setUsername('');
      setPassword('');
      setComments('');
    } else {
      setError(`Invalid ${requiredRole === 'supervisor' ? 'Supervisor' : 'Recipe Manager'} credentials`);
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setUsername('');
    setPassword('');
    setComments('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full bg-muted ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Adjustment Details */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Parameter</span>
              <span className="font-medium">{parameterName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current → Recommended</span>
              <span className="font-mono">
                {currentValue.toFixed(1)} → {recommendedValue.toFixed(1)} {unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Variation</span>
              <Badge variant={config.badgeVariant}>
                {variation.toFixed(2)} pts
              </Badge>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                {requiredRole === 'supervisor' ? 'Supervisor' : 'Recipe Manager'} Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={requiredRole === 'supervisor' ? 'supervisor' : 'recipemanager'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments or justification..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isLoading}
                className="min-h-[60px] text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="w-3 h-3" />
              <span>
                Demo credentials: {VALID_CREDENTIALS[requiredRole].username} / {VALID_CREDENTIALS[requiredRole].password}
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !username || !password}>
                {isLoading ? 'Verifying...' : 'Approve & Apply'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

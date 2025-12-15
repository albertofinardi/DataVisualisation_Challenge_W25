import { Calendar, Grid3X3, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

// Time bucket options: minutes
const TIME_BUCKET_OPTIONS = [
  { label: '15 mins', value: 15 },
  { label: '30 mins', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
  { label: '1 month', value: 43200 },
];

export interface SettingsPanelProps {
  startDate: string;
  setStartDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  cellSize: number;
  setCellSize: (v: number) => void;
  timeBucketIndex: number;
  setTimeBucketIndex: (v: number) => void;
  handleApplySettings: () => void;
  handleCancel: () => void;
  canApplySettings?: boolean;
}

export { TIME_BUCKET_OPTIONS };

export function SettingsPanel({
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  cellSize,
  setCellSize,
  timeBucketIndex,
  setTimeBucketIndex,
  handleApplySettings,
  handleCancel,
  canApplySettings = true,
}: SettingsPanelProps) {
  return (
    <div className="w-full space-y-6">
      {/* Date Range */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Start Date & Time
          </Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            End Date & Time
          </Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Cell Size */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Cell Size
          </span>
          <span className="text-accent font-semibold">{cellSize}</span>
        </Label>
        <Slider
          value={[cellSize]}
          onValueChange={(v) => setCellSize(v[0])}
          min={10}
          max={200}
          step={10}
          className="w-full"
        />
      </div>

      {/* Time Bucket */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Bucket
          </span>
          <span className="text-accent font-semibold">{TIME_BUCKET_OPTIONS[timeBucketIndex].label}</span>
        </Label>
        <Slider
          value={[timeBucketIndex]}
          onValueChange={(v) => setTimeBucketIndex(v[0])}
          min={0}
          max={TIME_BUCKET_OPTIONS.length - 1}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Aggregate data into {TIME_BUCKET_OPTIONS[timeBucketIndex].label} intervals
        </p>
      </div>

      {/* Validation Message */}
      {!canApplySettings && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">
            Date range must be at least 2x {TIME_BUCKET_OPTIONS[timeBucketIndex].label} long.
            Current selection is too short for the selected time bucket.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleApplySettings}
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={!canApplySettings}
        >
          Apply Settings
        </Button>
        <Button
          onClick={handleCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

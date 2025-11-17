import { Calendar, Grid3X3, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

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
  timeBucketMinutes: number;
  setTimeBucketMinutes: (v: number) => void;
  handleApplySettings: () => void;
  handleCancel: () => void;
}

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
  timeBucketMinutes,
  setTimeBucketMinutes,
  handleApplySettings,
  handleCancel,
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
            Time Bucket (minutes)
          </span>
          <span className="text-accent font-semibold">{timeBucketMinutes}</span>
        </Label>
        <Slider
          value={[timeBucketMinutes]}
          onValueChange={(v) => setTimeBucketMinutes(v[0])}
          min={1}
          max={120}
          step={1}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleApplySettings}
          className="flex-1 bg-accent hover:bg-accent/90"
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

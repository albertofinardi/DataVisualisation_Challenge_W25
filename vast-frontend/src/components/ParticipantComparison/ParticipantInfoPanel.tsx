import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantInfo, ActivityDistribution } from "@/types/participant-comparison.types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ACTIVITY_CONFIG } from "@/config/activities.config";

interface ParticipantInfoPanelProps {
  participantId: string;
  info: ParticipantInfo;
  activityDistribution: ActivityDistribution;
}

const EDUCATION_LABELS: { [key: string]: string } = {
  'Low': 'Low',
  'HighSchoolOrCollege': 'High School/College',
  'Bachelors': "Bachelor's Degree",
  'Graduate': 'Graduate Degree'
};

export function ParticipantInfoPanel({ 
  participantId, 
  info, 
  activityDistribution 
}: ParticipantInfoPanelProps) {
  // Prepare pie chart data
  const pieData = Object.entries(activityDistribution).map(([mode, count]) => ({
    name: mode,
    value: count,
  }));

  const totalCount = pieData.reduce((sum, item) => sum + item.value, 0);

  // Custom label to show percentage
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / totalCount) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className="space-y-4">
      {/* Demographics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participant {participantId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Age:</span>
              <p className="font-medium">{info.age} years</p>
            </div>
            <div>
              <span className="text-muted-foreground">Household:</span>
              <p className="font-medium">{info.household_size} {info.household_size === 1 ? 'person' : 'people'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Children:</span>
              <p className="font-medium">{info.have_kids ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Education:</span>
              <p className="font-medium">{EDUCATION_LABELS[info.education_level] || info.education_level}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Interest Group:</span>
              <p className="font-medium">{info.interest_group}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Joviality:</span>
              <p className="font-medium">{(info.joviality * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={ACTIVITY_CONFIG.colors[entry.name as keyof typeof ACTIVITY_CONFIG.colors] || '#888888'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => {
                  const percent = ((value / totalCount) * 100).toFixed(1);
                  return `${value.toLocaleString()} (${percent}%)`;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => value.replace(/([A-Z])/g, ' $1').trim()}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

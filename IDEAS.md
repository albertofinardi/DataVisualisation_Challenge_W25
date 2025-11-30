# VAST Challenge 2022: Engagement, Ohio - Visualization Plan

## Project Overview

**Goal**: Analyze 15 months of urban activity data from ~1,000 residents to support city planning

**Data**: ~18GB participant status logs (5-min intervals) + venues, travel, financial journals

**Stack**: React + D3.js frontend, PostgreSQL + PostGIS backend

---

## Three Core Questions

1. **Characterize city areas & identify traffic bottlenecks**
2. **Describe daily patterns of 2 different participants**
3. **Identify significant pattern changes over 15 months**

---

## Required Visualizations (10 total)

### Question 1: City Areas & Traffic (4 visualizations)

#### 1. Spatial Activity Heatmap ⭐ - DONE(ish)
- Hexagonal grid showing activity density
- Interactive time slider (hour/day/week)
- Toggle by activity type (work, restaurant, recreation, transport)
- **Aggregation**: `GROUP BY grid_cell, time_period, activity_mode`
- Modify to instead of showing the squares, smooth out and do proper heatmap


#### 2. Origin-Destination Flow Diagram ⭐
- Chord or Sankey diagram showing movement between areas
- Filter by time period and trip purpose
- **Aggregation**: `FROM travel_journal GROUP BY origin, destination`

#### 3. Average Speed Heatmap
- Grid colored by travel speed (red=slow, green=fast)
- Time-of-day filter for rush hour analysis
- **Aggregation**: `CALCULATE distance/duration GROUP BY route_cell, time`

#### 4. Building/Venue Clustering Map
- Buildings colored by type (residential/commercial/school)
- Sized by usage intensity
- **Aggregation**: `FROM buildings GROUP BY type, location`

---

### Question 2: Participant Patterns (3 visualizations)

#### 5. Participant Movement Trace ⭐
- Path on map for 2 selected participants
- Color-coded by activity type
- Show weekday vs weekend comparison
- **Query**: `SELECT location, activity, timestamp WHERE participant_id IN (p1, p2) ORDER BY time`

#### 6. Activity Timeline Calendar ⭐
- Rows = days, Columns = hours
- Color = activity type
- Shows consistency/variations in routines
- **Aggregation**: `GROUP BY participant, date, hour SELECT dominant_activity`

#### 7. Daily Activity Breakdown
- Radial timeline or stacked bar chart
- Hours spent per activity type
- Side-by-side comparison of 2 participants
- **Aggregation**: `GROUP BY participant, activity SUM(time_spent)`

---

### Question 3: Pattern Changes (3 visualizations)

#### 8. Temporal Activity Distribution (Streamgraph) ⭐
- X-axis = months, Y-axis = activity percentages
- Shows city-wide behavior shifts
- **Aggregation**: `GROUP BY date_period, activity COUNT(*) calculate percentage`

#### 9. Venue Popularity Trends (Bump Chart)
- Track top 10-20 venues over time
- Shows rising/declining areas
- **Aggregation**: `GROUP BY venue, time_period COUNT visits RANK by popularity`

#### 10. Spatial Evolution (Small Multiples) ⭐
- 5-6 maps showing key time periods (Month 1, 3, 6, 9, 12, 15)
- Same color scale for comparison
- **Aggregation**: `FOR EACH period GROUP BY grid_cell COUNT activities`

---

## Data Aggregation Strategies

### Spatial Aggregation
**H3 Hexagonal Binning** (Recommended):
- Resolution 8: ~460m hexagons (city-wide)
- Resolution 9: ~174m hexagons (neighborhood detail)
- Query: `GROUP BY h3_index_res8`

**Alternative - Square Grid**:
- Define cell size (e.g., 0.001° ≈ 111m)
- Query: `GROUP BY FLOOR(lat/cell_size), FLOOR(lng/cell_size)`

### Temporal Aggregation
- **Hourly**: For daily patterns
- **Daily/Day-of-week**: For weekly routines
- **Weekly/Monthly**: For long-term trends

### Key Query Patterns

**Activity Density**:
```sql
SELECT grid_cell, time_bucket, activity_mode,
       COUNT(*) as activity_count,
       COUNT(DISTINCT participant_id) as unique_visitors
FROM participant_status
WHERE timestamp BETWEEN start_date AND end_date
GROUP BY grid_cell, time_bucket, activity_mode
```

**Flow Analysis**:
```sql
SELECT origin_grid, destination_grid,
       COUNT(*) as trip_count,
       AVG(duration) as avg_duration
FROM travel_journal
GROUP BY origin_grid, destination_grid
HAVING COUNT(*) >= 10
ORDER BY trip_count DESC
```

**Speed Calculation**:
```sql
SELECT route_grid,
       AVG(distance / NULLIF(duration, 0)) as avg_speed
FROM (
  SELECT calculate_distance(start_loc, end_loc) as distance,
         EXTRACT(EPOCH FROM (end_time - start_time))/3600 as duration,
         midpoint_grid as route_grid
  FROM travel_journal
)
GROUP BY route_grid
```

**Participant Timeline**:
```sql
SELECT timestamp, location, current_mode, available_balance
FROM participant_status
WHERE participant_id = :id
  AND timestamp BETWEEN :start AND :end
ORDER BY timestamp
```

**Activity Distribution Over Time**:
```sql
SELECT DATE_TRUNC('week', timestamp) as week,
       current_mode,
       COUNT(*)::FLOAT / SUM(COUNT(*)) OVER (PARTITION BY week) * 100 as percentage
FROM participant_status
GROUP BY week, current_mode
ORDER BY week
```

---

## API Endpoints

```
GET /api/heatmap?startDate&endDate&gridSize&mode
GET /api/flows?startDate&endDate&spatialLevel&purpose
GET /api/speed-map?startDate&endDate&timeOfDay&gridSize
GET /api/trace?participantId&startDate&endDate
GET /api/activity-timeline?participantId&startDate&endDate&aggregation
GET /api/activity-distribution?startDate&endDate&aggregation
GET /api/venue-trends?venueType&startDate&endDate&topN
GET /api/spatial-evolution?timePoints&gridSize
```

---

## Implementation Priority

### Phase 1 (Core - covers all 3 questions)
1. Spatial Activity Heatmap
2. Participant Movement Trace
3. Activity Timeline Calendar
4. Temporal Activity Streamgraph

### Phase 2 (Enhanced analysis)
5. Origin-Destination Flow Diagram
6. Speed Heatmap
7. Small Multiples Evolution

### Phase 3 (Supporting context)
8. Building Clustering Map
9. Venue Popularity Trends
10. Daily Activity Breakdown

---

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_participant_time ON participant_status(participant_id, timestamp);
CREATE INDEX idx_h3_time ON participant_status(h3_index_res8, timestamp);
CREATE INDEX idx_mode_time ON participant_status(current_mode, timestamp);
CREATE INDEX idx_location_gist ON participant_status USING GIST(location);
```

### Materialized Views
```sql
CREATE MATERIALIZED VIEW daily_grid_activity AS
SELECT DATE(timestamp) as date, h3_index_res8, current_mode,
       COUNT(*) as activity_count,
       COUNT(DISTINCT participant_id) as unique_visitors
FROM participant_status
GROUP BY date, h3_index_res8, current_mode;
```

### Caching Strategy
- Use Redis for frequent queries
- Cache common aggregations (daily summaries, popular venues)
- Pre-compute heatmaps for standard time windows

---

## D3 + React Integration

**Component Pattern**:
```javascript
const Visualization = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const svgRef = useRef();

  useEffect(() => {
    fetchData(filters).then(setData);
  }, [filters]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    // D3 rendering code
  }, [data]);

  return (
    <>
      <FilterControls onChange={setFilters} />
      <svg ref={svgRef} />
    </>
  );
};
```

**Key D3 Techniques**:
- `d3.hexbin()` for spatial heatmaps
- `d3.chord()` for flow diagrams
- `d3.stack()` + `d3.area()` for streamgraphs
- `d3.line()` for movement traces
- `d3.scaleSequential()` for color scales
- `d3.transition()` for smooth animations

---

## Deliverables Format

**Each question**: Up to 10 images, 500 words max

**Question 1**: 3-4 heatmap views + 1-2 flow diagrams + speed map + analysis
**Question 2**: 2 participant traces (multiple days) + 2 calendars + breakdown + analysis
**Question 3**: 1 streamgraph + 5-6 small multiples + trend charts + analysis

---

## Notes

- All visualizations must be **interactive** (D3-based)
- Focus on **storytelling** with clear insights
- Use **consistent color schemes** across related views
- Include **tooltips** for detailed data on hover
- Provide **legends and labels** for clarity
- Export **static images** for report while maintaining interactive versions
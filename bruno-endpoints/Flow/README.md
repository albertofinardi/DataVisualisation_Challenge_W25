# Flow Diagram API Endpoints

This collection contains Bruno requests for testing the Origin-Destination (OD) flow analysis endpoints.

## Overview

The Flow API analyzes travel patterns by aggregating trips from the `travel_journal` table and joining with the `buildings` table to get actual geographic coordinates. It groups trips by origin and destination grid cells to identify major traffic corridors and bottlenecks.

## Endpoint

```
GET /api/flow/od-flows
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | ISO 8601 timestamp | - | Optional start time filter (e.g., `2022-03-21T07:00:00Z`) |
| `end` | ISO 8601 timestamp | - | Optional end time filter (e.g., `2022-03-21T19:00:00Z`) |
| `cell_size` | number | 50 | Grid cell size for spatial aggregation (units) |
| `min_trip_count` | number | 10 | Minimum trips required to include a flow |

## Response Format

```json
{
  "flows": [
    {
      "origin_grid_x": 10,
      "origin_grid_y": 20,
      "destination_grid_x": 15,
      "destination_grid_y": 25,
      "trip_count": 234,
      "avg_duration_minutes": 12.5,
      "origin_center_longitude": -500.0,
      "origin_center_latitude": 1000.0,
      "destination_center_longitude": -250.0,
      "destination_center_latitude": 1250.0
    }
  ]
}
```

## Available Test Requests

### 1. Rush Hour Analysis
**File:** `OD Flows - Rush Hour.bru`
- **Time:** 7 AM - 7 PM on 2022-03-21
- **Cell Size:** 50 units
- **Min Trips:** 10
- **Use Case:** Identify peak-hour traffic patterns and bottlenecks

### 2. Full Day Analysis
**File:** `OD Flows - Full Day.bru`
- **Time:** 24 hours (2022-03-21 00:00 - 2022-03-22 00:00)
- **Cell Size:** 50 units
- **Min Trips:** 5
- **Use Case:** Analyze complete daily travel patterns

### 3. Large Cells (Weekly Overview)
**File:** `OD Flows - Large Cells.bru`
- **Time:** 1 week (2022-03-21 to 2022-03-28)
- **Cell Size:** 100 units (larger = broader overview)
- **Min Trips:** 50
- **Use Case:** High-level city-wide traffic analysis

### 4. Fine Detail (Morning Rush)
**File:** `OD Flows - Fine Detail.bru`
- **Time:** 2 hours (7 AM - 9 AM on 2022-03-21)
- **Cell Size:** 25 units (smaller = more detail)
- **Min Trips:** 1
- **Use Case:** Detailed micro-level bottleneck analysis
- **⚠️ Warning:** May return large dataset!

### 5. Weekend Analysis
**File:** `OD Flows - Weekend.bru`
- **Time:** Weekend (2022-03-26 to 2022-03-28)
- **Cell Size:** 50 units
- **Min Trips:** 10
- **Use Case:** Compare weekend vs weekday patterns

### 6. No Filters (All Data)
**File:** `OD Flows - No Filters.bru`
- **Time:** All available data
- **Cell Size:** 50 units
- **Min Trips:** 10
- **Use Case:** Complete historical analysis
- **⚠️ Warning:** May take 60+ seconds!

## How the Query Works

1. **JOIN with Buildings:** The travel_journal stores location IDs, not coordinates. The query joins with the buildings table to get actual GEOMETRY polygons.

2. **Centroid Calculation:** Uses `ST_Centroid()` to get the center point of each building polygon.

3. **Grid Aggregation:** Converts coordinates to grid cells using `FLOOR(coordinate / cell_size)`.

4. **Trip Aggregation:** Groups trips by origin-destination pairs and counts occurrences.

5. **Duration Calculation:** Computes average trip duration from `travel_start_time` and `travel_end_time`.

6. **Filtering:** Excludes trips that start and end in the same cell, and flows with fewer trips than `min_trip_count`.

## Performance Tips

### For Faster Queries:
- Use larger `cell_size` (100-200 units)
- Increase `min_trip_count` (20-50 trips)
- Use shorter time windows (hours or single days)

### For More Detail:
- Use smaller `cell_size` (25-50 units)
- Decrease `min_trip_count` (1-5 trips)
- Note: This significantly increases data volume

## Common Use Cases

### Traffic Bottleneck Analysis
Use "Rush Hour" or "Fine Detail" queries to identify congestion points during peak hours.

### Infrastructure Planning
Use "Large Cells" or "No Filters" for city-wide traffic corridor identification.

### Pattern Comparison
Compare "Weekend" vs weekday (Full Day) to understand leisure vs commute patterns.

### Time-of-Day Analysis
Create custom queries with specific hour ranges to analyze morning, afternoon, or evening patterns.

## Database Schema Reference

### travel_journal table:
```sql
CREATE TABLE travel_journal (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    travel_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    travel_start_location_id INTEGER,  -- References buildings.building_id
    travel_end_time TIMESTAMP WITH TIME ZONE,
    travel_end_location_id INTEGER,    -- References buildings.building_id
    purpose VARCHAR(100),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    starting_balance DECIMAL(10, 2),
    ending_balance DECIMAL(10, 2)
);
```

### buildings table:
```sql
CREATE TABLE buildings (
    building_id INTEGER PRIMARY KEY,
    location GEOMETRY(POLYGON),  -- Building boundary polygon
    building_type VARCHAR(50),
    max_occupancy INTEGER,
    units INTEGER[]
);
```

## Troubleshooting

### Query Times Out
- Reduce the time window
- Increase `cell_size`
- Increase `min_trip_count`
- Check database indexes exist on travel_journal

### No Results Returned
- Check that date range has data (dataset spans specific dates)
- Reduce `min_trip_count` to see if there's any flow data
- Verify time format is ISO 8601 with timezone (Z suffix)

### Too Much Data
- Increase `min_trip_count`
- Use larger `cell_size`
- Reduce time window

## Example Analysis Workflow

1. Start with **"Large Cells"** to get overview
2. Identify interesting time periods or areas
3. Use **"Rush Hour"** to focus on peak traffic
4. Drill down with **"Fine Detail"** for specific bottlenecks
5. Compare with **"Weekend"** to understand pattern variations

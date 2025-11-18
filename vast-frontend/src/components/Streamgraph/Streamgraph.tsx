import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TemporalStreamgraphData } from '../../types/streamgraph.types';
import { STREAMGRAPH_CONFIG, getActivityColor } from '../../config/streamgraph.config';

interface StreamgraphProps {
  data: TemporalStreamgraphData;
  width?: number;
  height?: number;
}

export function Streamgraph({
  data,
  width,
  height = STREAMGRAPH_CONFIG.visual.defaultHeight,
}: StreamgraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pieRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamgraphContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<{ [key: string]: number } | null>(null);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<string | null>(null);
  const [streamgraphWidth, setStreamgraphWidth] = useState(STREAMGRAPH_CONFIG.visual.defaultWidth);

  // Calculate streamgraph width based on container
  useEffect(() => {
    if (!streamgraphContainerRef.current) return;

    const updateWidth = () => {
      if (streamgraphContainerRef.current) {
        const containerWidth = streamgraphContainerRef.current.offsetWidth;
        setStreamgraphWidth(containerWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || Object.keys(data).length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Setup margins and dimensions
    const margin = STREAMGRAPH_CONFIG.visual.margin;
    const actualWidth = width || streamgraphWidth;
    const innerWidth = actualWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', actualWidth)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse data into format suitable for d3.stack
    const timestamps = Object.keys(data).sort();
    const allActivities = Array.from(
      new Set(Object.values(data).flatMap((d) => Object.keys(d)))
    ).sort();

    // Convert data to array format for d3.stack
    const stackData = timestamps.map((timestamp) => {
      const timeData: { [key: string]: any } = { timestamp };
      allActivities.forEach((activity) => {
        timeData[activity] = data[timestamp][activity] || 0;
      });
      return timeData;
    });

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain([new Date(timestamps[0]), new Date(timestamps[timestamps.length - 1])])
      .range([0, innerWidth]);

    // Stack the data
    const stack = d3
      .stack()
      .keys(allActivities)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette); // Centers streams symmetrically around zero

    const series = stack(stackData as any);

    // Calculate y scale based on the stacked data
    const yExtent = [
      d3.min(series, (layer) => d3.min(layer, (d) => d[0])) || 0,
      d3.max(series, (layer) => d3.max(layer, (d) => d[1])) || 0,
    ];

    const yScale = d3.scaleLinear().domain(yExtent).range([innerHeight, 0]);

    // Color scale using config
    const colorScale = (activity: string) => getActivityColor(activity);

    // Create area generator
    const area = d3
      .area<any>()
      .x((d, i) => xScale(new Date(timestamps[i])))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveBasis);

    // Create tooltip
    const tooltipConfig = STREAMGRAPH_CONFIG.visual.tooltip;
    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', tooltipConfig.backgroundColor)
      .style('color', tooltipConfig.textColor)
      .style('padding', tooltipConfig.padding)
      .style('border-radius', tooltipConfig.borderRadius)
      .style('font-size', tooltipConfig.fontSize)
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', tooltipConfig.maxWidth)
      .style('box-shadow', tooltipConfig.boxShadow);

    // Draw layers
    const layers = g
      .selectAll('.layer')
      .data(series)
      .join('g')
      .attr('class', 'layer');

    layers
      .append('path')
      .attr('class', 'area')
      .attr('d', area)
      .style('fill', (d) => colorScale(d.key))
      .style('opacity', STREAMGRAPH_CONFIG.visual.streamOpacity)

    // Create vertical selection line (AFTER layers so it's on top)
    const verticalLine = g
      .append('line')
      .attr('class', 'sel-line')
      .style('stroke', STREAMGRAPH_CONFIG.visual.verticalLineColor)
      .style('stroke-width', STREAMGRAPH_CONFIG.visual.verticalLineWidth)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Bisector for finding nearest timestamp
    const bisectDate = d3.bisector((d: string) => new Date(d).getTime()).left;

    // Hover handler
    function onHover(event: any) {
      const [mouseX] = d3.pointer(event, g.node());
      const hoveredTime = xScale.invert(mouseX).getTime();

      // Find closest timestamp
      const idx = bisectDate(timestamps, hoveredTime);
      const closestTimestamp = timestamps[idx] || timestamps[timestamps.length - 1];

      // Get all activity values at this timestamp
      const timestampData = data[closestTimestamp] || {};

      // Update state for pie chart
      setHoveredData(timestampData);
      setHoveredTimestamp(closestTimestamp);

      // Show vertical line at selected timestep
      const xPos = xScale(new Date(closestTimestamp));
      verticalLine
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .style('opacity', STREAMGRAPH_CONFIG.visual.verticalLineOpacity);

      // Build tooltip content with all activities
      let tooltipHtml = `<div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
        ${new Date(closestTimestamp).toLocaleString()}
      </div>`;

      // Sort activities by count (descending)
      const sortedActivities = Object.entries(timestampData)
        .sort(([, a], [, b]) => (b as number) - (a as number));

      sortedActivities.forEach(([activity, count]) => {
        const color = colorScale(activity);
        tooltipHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px;"></div>
              <span>${activity}</span>
            </div>
            <span style="font-weight: bold; margin-left: 16px;">${count}</span>
          </div>
        `;
      });

      // Calculate total
      const total = Object.values(timestampData).reduce((sum, val) => sum + (val as number), 0);
      tooltipHtml += `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.3); font-weight: bold;">
          Total: ${total}
        </div>
      `;

      tooltip
        .html(tooltipHtml)
        .style('visibility', 'visible')
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 300}px`);
    }

    // Hide selection
    function hideSelection() {
      tooltip.style('visibility', 'hidden');
      verticalLine.style('opacity', 0);
      setHoveredData(null);
      setHoveredTimestamp(null);
    }

    // Create invisible overlay for mouse tracking (ON TOP OF EVERYTHING)
    g.append('rect')
      .attr('class', 'hover-overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .style('cursor', 'crosshair')
      .on('mousemove', onHover)
      .on('mouseleave', hideSelection);

    // Add X axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append('g').attr('class', 'y-axis').call(yAxis);

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 5)
      .text('Time');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 15)
      .text('Participants');

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, streamgraphWidth]);

  // Pie chart effect
  useEffect(() => {
    if (!pieRef.current) return;

    const pieWidth = 350;
    const pieHeight = 500;
    const radius = 120;

    // Clear previous pie chart
    d3.select(pieRef.current).selectAll('*').remove();

    const svg = d3
      .select(pieRef.current)
      .attr('width', pieWidth)
      .attr('height', pieHeight);

    const g = svg.append('g').attr('transform', `translate(${pieWidth / 2}, 180)`);

    if (!hoveredData || Object.keys(hoveredData).length === 0) {
      // Show placeholder
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -30)
        .style('font-size', '16px')
        .style('fill', '#888')
        .style('font-weight', '500')
        .text('Hover over the');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 0)
        .style('font-size', '16px')
        .style('fill', '#888')
        .style('font-weight', '500')
        .text('streamgraph to see');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 30)
        .style('font-size', '16px')
        .style('fill', '#888')
        .style('font-weight', '500')
        .text('activity distribution');

      return;
    }

    // Get all activities from original data
    const allActivities = Array.from(
      new Set(Object.values(data).flatMap((d) => Object.keys(d)))
    ).sort();

    // Calculate total for percentages
    const total = Object.values(hoveredData).reduce((sum, val) => sum + val, 0);

    // Prepare data for pie chart
    const pieData = Object.entries(hoveredData)
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: ((count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);

    // Create pie generator
    const pie = d3
      .pie<any>()
      .value((d) => d.count)
      .sort(null);

    // Create arc generator
    const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

    const colorScale = (activity: string) => getActivityColor(activity);

    const outerArc = d3
      .arc<any>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    // Draw pie slices
    const slices = g
      .selectAll('.arc')
      .data(pie(pieData))
      .join('g')
      .attr('class', 'arc');

    slices
      .append('path')
      .attr('d', arc)
      .style('fill', (d) => colorScale(d.data.activity))
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .style('opacity', 0.8)
      .on('mouseover', function () {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.8);
      });

    // Add percentage labels
    slices
      .append('text')
      .attr('transform', (d) => {
        const pos = arc.centroid(d);
        return `translate(${pos})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .text((d) => (parseFloat(d.data.percentage) > 5 ? `${d.data.percentage}%` : ''));

    // Add legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 330)`);

    const legendItems = legend
      .selectAll('.legend-item')
      .data(pieData)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 22})`);

    legendItems
      .append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .style('fill', (d) => colorScale(d.activity));

    legendItems
      .append('text')
      .attr('x', 20)
      .attr('y', 11)
      .style('font-size', '12px')
      .text((d) => `${d.activity}`);

    legendItems
      .append('text')
      .attr('x', 150)
      .attr('y', 11)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text((d) => `${d.count}`);

    legendItems
      .append('text')
      .attr('x', 220)
      .attr('y', 11)
      .style('font-size', '11px')
      .style('fill', '#666')
      .text((d) => `(${d.percentage}%)`);

    // Add timestamp title
    if (hoveredTimestamp) {
      svg
        .append('text')
        .attr('x', pieWidth / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text(new Date(hoveredTimestamp).toLocaleString());
    }
  }, [hoveredData, hoveredTimestamp, data]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', gap: '30px', alignItems: 'flex-start', width: '100%' }}>
      <div ref={streamgraphContainerRef} style={{ flex: 1, minWidth: 0 }}>
        <svg ref={svgRef}></svg>
      </div>
      <div
        style={{
          width: '350px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          border: '1px solid rgba(128, 128, 128, 0.2)',
          borderRadius: '8px',
          padding: '0',
          backgroundColor: 'rgba(248, 248, 248, 0.5)',
        }}
      >
        <svg ref={pieRef}></svg>
      </div>
    </div>
  );
}

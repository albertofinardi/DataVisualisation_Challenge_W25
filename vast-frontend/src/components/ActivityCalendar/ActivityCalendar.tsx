import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ActivityTimelineData } from '../../types/activity-calendar.types';
import { getActivityColor } from '../../config/activities.config';

interface ActivityCalendarProps {
  data: ActivityTimelineData;
  width?: number;
  height?: number;
}

const CELL_SIZE = 20;
const MARGIN = { top: 80, right: 200, bottom: 60, left: 80 };

export function ActivityCalendar({
  data,
  width = 1400,
  height,
}: ActivityCalendarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [calendarWidth, setCalendarWidth] = useState(width);

  // Calculate calendar width based on container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setCalendarWidth(Math.max(1200, containerWidth - 40));
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

    // Parse data into array format
    const dates = Object.keys(data).sort();
    if (dates.length === 0) return;

    // Create cell data
    const cellData: Array<{
      date: string;
      hour: number;
      activity: string;
      count: number;
    }> = [];

    dates.forEach((date) => {
      const dayData = data[date];
      for (let hour = 0; hour < 24; hour++) {
        const hourKey = String(hour);
        if (dayData[hourKey]) {
          cellData.push({
            date,
            hour,
            activity: dayData[hourKey].activity,
            count: dayData[hourKey].count,
          });
        } else {
          // No data for this hour
          cellData.push({
            date,
            hour,
            activity: 'NoData',
            count: 0,
          });
        }
      }
    });

    // Calculate dimensions
    const numDays = dates.length;
    const numHours = 24;
    const innerWidth = calendarWidth - MARGIN.left - MARGIN.right;

    // Calculate cell size based on width constraint for hours
    const cellWidth = innerWidth / numHours;

    // Use provided height or calculate proportional height based on number of days
    const cellHeight = height
      ? Math.min(CELL_SIZE, (height - MARGIN.top - MARGIN.bottom) / numDays)
      : CELL_SIZE;

    const actualWidth = cellWidth * numHours + MARGIN.left + MARGIN.right;
    const actualHeight = cellHeight * numDays + MARGIN.top + MARGIN.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', actualWidth)
      .attr('height', actualHeight);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Create tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.85)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', '250px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)');

    // Draw cells
    const cells = g
      .selectAll('.cell')
      .data(cellData)
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d) => d.hour * cellWidth)
      .attr('y', (d) => {
        const dayIndex = dates.indexOf(d.date);
        return dayIndex * cellHeight;
      })
      .attr('width', cellWidth - 1)
      .attr('height', cellHeight - 1)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('fill', (d) => {
        if (d.activity === 'NoData') return '#f0f0f0';
        return getActivityColor(d.activity);
      })
      .style('stroke', 'white')
      .style('stroke-width', 1)
      .style('opacity', 0.9)
      .on('mouseover', function (event, d) {
        d3.select(this)
          .style('opacity', 1)
          .style('stroke', '#000')
          .style('stroke-width', 2);

        const color = d.activity === 'NoData' ? '#999' : getActivityColor(d.activity);
        const activityLabel = d.activity === 'NoData' ? 'No Data' : d.activity;

        const tooltipHtml = `
          <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
            ${new Date(d.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Hour:</strong> ${d.hour}:00 - ${d.hour + 1}:00
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 2px;"></div>
            <span style="font-weight: bold;">${activityLabel}</span>
          </div>
          ${d.count > 0 ? `<div style="margin-top: 4px; font-size: 12px; color: #ccc;">Count: ${d.count}</div>` : ''}
        `;

        tooltip
          .html(tooltipHtml)
          .style('visibility', 'visible')
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 80}px`);
      })
      .on('mouseout', function () {
        d3.select(this)
          .style('opacity', 0.9)
          .style('stroke', 'white')
          .style('stroke-width', 1);

        tooltip.style('visibility', 'hidden');
      });

    // Add hour labels (X-axis)
    const hourLabels = g
      .selectAll('.hour-label')
      .data(d3.range(24))
      .join('text')
      .attr('class', 'hour-label')
      .attr('x', (d) => d * cellWidth + cellWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text((d) => `${d}h`);

    // Add date labels (Y-axis)
    const dateLabels = g
      .selectAll('.date-label')
      .data(dates)
      .join('text')
      .attr('class', 'date-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * cellHeight + cellHeight / 2 + 4)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text((d) => {
        const date = new Date(d);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dayOfWeek}, ${monthDay}`;
      });

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', (numHours * cellWidth) / 2)
      .attr('y', -40)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Hour of Day');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(numDays * cellHeight) / 2)
      .attr('y', -65)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Date');

    // Add legend
    const activities = Array.from(
      new Set(cellData.filter((d) => d.activity !== 'NoData').map((d) => d.activity))
    ).sort();

    // Add "No Data" to the legend
    const legendItems = [...activities, 'NoData'];

    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${actualWidth - MARGIN.right + 20}, ${MARGIN.top})`);

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Activities');

    const legendItemGroups = legend
      .selectAll('.legend-item')
      .data(legendItems)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItemGroups
      .append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('fill', (d) => {
        if (d === 'NoData') return '#f0f0f0';
        return getActivityColor(d);
      })
      .style('opacity', 0.9);

    legendItemGroups
      .append('text')
      .attr('x', 25)
      .attr('y', 13)
      .style('font-size', '12px')
      .style('fill', '#333')
      .text((d) => d === 'NoData' ? 'No Data' : d);

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, calendarWidth, height]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

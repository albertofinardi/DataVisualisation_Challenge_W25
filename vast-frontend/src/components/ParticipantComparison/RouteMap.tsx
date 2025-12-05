import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MAP_CONFIG } from '@/config/map.config';
import { ACTIVITY_CONFIG } from '@/config/activities.config';
import { TimelinePoint } from '@/types/participant-comparison.types';
import BaseMapImage from '@/assets/BaseMap.png';

interface RouteMapProps {
  participant1Timeline: TimelinePoint[];
  participant2Timeline: TimelinePoint[];
  currentTimeIndex: number;
  trailLength: number;
  participant1Id: string;
  participant2Id: string;
}

export function RouteMap({
  participant1Timeline,
  participant2Timeline,
  currentTimeIndex,
  trailLength,
  participant1Id,
  participant2Id,
}: RouteMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height, padding } = MAP_CONFIG.visual;
    const { bounds } = MAP_CONFIG;

    // Create coordinate scales
    const xScale = d3
      .scaleLinear()
      .domain([bounds.minLongitude, bounds.maxLongitude])
      .range([padding.left, width - padding.right]);

    const yScale = d3
      .scaleLinear()
      .domain([bounds.maxLatitude, bounds.minLatitude])
      .range([padding.top, height - padding.bottom]);

    const g = svg.append('g');

    // Add background map
    g.append('image')
      .attr('href', BaseMapImage)
      .attr('x', padding.left)
      .attr('y', padding.top)
      .attr('width', width - padding.left - padding.right)
      .attr('height', height - padding.top - padding.bottom)
      .attr('opacity', MAP_CONFIG.image.opacity)
      .attr('preserveAspectRatio', 'none');

    // Helper function to draw trail for a participant
    const drawTrail = (
      timeline: TimelinePoint[],
      color: string,
      participantId: string
    ) => {
      const startIndex = Math.max(0, currentTimeIndex - trailLength);
      const endIndex = currentTimeIndex + 1;
      const visiblePoints = timeline.slice(startIndex, endIndex);

      if (visiblePoints.length < 2) return;

      // Create line generator
      const line = d3.line<TimelinePoint>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveCardinal);

      // Draw trail path with gradient opacity
      const trailGroup = g.append('g')
        .attr('class', `trail-${participantId}`);

      // Draw segments with decreasing opacity
      for (let i = 0; i < visiblePoints.length - 1; i++) {
        const segment = [visiblePoints[i], visiblePoints[i + 1]];
        const opacity = 0.3 + (0.7 * i / Math.max(1, visiblePoints.length - 1));
        
        trailGroup.append('path')
          .datum(segment)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', ACTIVITY_CONFIG.colors[segment[0].mode as keyof typeof ACTIVITY_CONFIG.colors] || color)
          .attr('stroke-width', 3)
          .attr('stroke-opacity', opacity)
          .attr('stroke-linecap', 'round');
      }

      // Draw current position marker
      if (visiblePoints.length > 0) {
        const currentPoint = visiblePoints[visiblePoints.length - 1];
        
        trailGroup.append('circle')
          .attr('cx', xScale(currentPoint.x))
          .attr('cy', yScale(currentPoint.y))
          .attr('r', 8)
          .attr('fill', color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);

        // Add participant label
        trailGroup.append('text')
          .attr('x', xScale(currentPoint.x))
          .attr('y', yScale(currentPoint.y) - 15)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('stroke', 'black')
          .attr('stroke-width', 3)
          .attr('paint-order', 'stroke')
          .text(`P${participantId}`);
      }
    };

    // Draw trails for both participants (different colors)
    drawTrail(participant1Timeline, '#ff6b6b', participant1Id);
    drawTrail(participant2Timeline, '#4ecdc4', participant2Id);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, ${padding.top + 20})`);

    legend.append('rect')
      .attr('width', 130)
      .attr('height', 60)
      .attr('fill', 'rgba(0, 0, 0, 0.7)')
      .attr('rx', 5);

    legend.append('circle')
      .attr('cx', 15)
      .attr('cy', 20)
      .attr('r', 6)
      .attr('fill', '#ff6b6b');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 25)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text(`Participant ${participant1Id}`);

    legend.append('circle')
      .attr('cx', 15)
      .attr('cy', 45)
      .attr('r', 6)
      .attr('fill', '#4ecdc4');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 50)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text(`Participant ${participant2Id}`);

  }, [
    participant1Timeline, 
    participant2Timeline, 
    currentTimeIndex, 
    trailLength,
    participant1Id,
    participant2Id
  ]);

  return (
    <div className="relative w-full flex justify-center">
      <svg
        ref={svgRef}
        width={MAP_CONFIG.visual.width * 0.6}
        height={MAP_CONFIG.visual.height * 0.6}
        className="border rounded-lg bg-background"
        viewBox={`0 0 ${MAP_CONFIG.visual.width} ${MAP_CONFIG.visual.height}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}

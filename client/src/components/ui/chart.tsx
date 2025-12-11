import { useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  BarController,
  Title, 
  Tooltip, 
  Legend, 
  type ChartData, 
  type ChartOptions 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

interface ChartProps {
  data: ChartData<'bar', number[], string>;
  options?: ChartOptions<'bar'>;
  className?: string;
  ariaLabel?: string;
}

export function Chart({ data, options = {}, className = "", ariaLabel = "Bar chart displaying lottery number frequency data" }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS<'bar', number[], string> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(...data.datasets[0].data) + 1,
            ticks: {
              stepSize: 1
            }
          }
        },
        ...options
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      role="img"
      aria-label={ariaLabel}
    />
  );
}

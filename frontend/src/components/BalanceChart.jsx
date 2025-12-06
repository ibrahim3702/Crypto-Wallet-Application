import { useEffect, useRef } from 'react';

export default function BalanceChart({ data = [] }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale context to ensure correct drawing operations
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Generate sample data if empty
        const chartData = data.length > 0 ? data : generateSampleData();

        const maxValue = Math.max(...chartData.map(d => d.value));
        const minValue = Math.min(...chartData.map(d => d.value));
        const range = maxValue - minValue || 1;

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const stepX = chartWidth / (chartData.length - 1);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw gradient area
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.moveTo(padding, height - padding);

        chartData.forEach((point, index) => {
            const x = padding + stepX * index;
            const normalizedValue = (point.value - minValue) / range;
            const y = height - padding - normalizedValue * chartHeight;

            if (index === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
        ctx.lineWidth = 2;

        chartData.forEach((point, index) => {
            const x = padding + stepX * index;
            const normalizedValue = (point.value - minValue) / range;
            const y = height - padding - normalizedValue * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        chartData.forEach((point, index) => {
            const x = padding + stepX * index;
            const normalizedValue = (point.value - minValue) / range;
            const y = height - padding - normalizedValue * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#3B82F6';
            ctx.fill();
        });

        // Draw time labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelIndices = [0, Math.floor(chartData.length / 2), chartData.length - 1];
        labelIndices.forEach(index => {
            if (chartData[index]) {
                const x = padding + stepX * index;
                ctx.fillText(chartData[index].time, x, height - 15);
            }
        });

    }, [data]);

    const generateSampleData = () => {
        const hours = 24;
        const baseValue = 1.2345;
        return Array.from({ length: hours }, (_, i) => ({
            time: `${i}:00`,
            value: baseValue + (Math.sin(i / 3) * 0.05) + (Math.random() * 0.02 - 0.01)
        }));
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '200px' }}
            className="w-full"
        />
    );
}

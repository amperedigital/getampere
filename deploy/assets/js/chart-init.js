/**
 * Chart.js Initialization for GetAmpere
 * Handles: Fixed Chart, 3D Chart, and Aura Chart
 */

(function() {
    // Helper to ensure Chart.js is loaded
    const waitForChart = (callback) => {
        if (typeof Chart !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForChart(callback), 100);
        }
    };

    // 1. Fixed Chart (Calls per day vs Close Rate)
    const initFixedChart = () => {
        const canvas = document.getElementById('canvas-3d-ai-graph-fixed');
        if (!canvas) return;
        
        // This chart uses a custom resize handler, so we define the core setup first.
        const setup = () => {
            const width = window.innerWidth;
            const hideStacks = width <= 640 || (width >= 769 && width <= 1024);

            const ctx = canvas.getContext('2d');
            // Destroy existing chart if initialized
            if (canvas.chart) canvas.chart.destroy();
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient1.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
            gradient1.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

            const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient2.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
            gradient2.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

            canvas.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Incoming',
                            data: [150, 190, 150, 110, 160, 150, 100],
                            borderColor: '#22c55e',
                            backgroundColor: gradient1,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#22c55e',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            yAxisID: 'volume'
                        },
                        {
                            label: 'Close Rate',
                            data: [22, 24, 21, 18, 25, 23, 20],
                            borderColor: '#38bdf8',
                            backgroundColor: gradient2,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#38bdf8',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            yAxisID: 'closeRate'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: hideStacks ? { padding: 0 } : { padding: { left: 4, right: 4 } },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        datasetPadding: hideStacks ? undefined : { padding: { left: 16, right: 16 } },
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(9, 9, 11, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#A1A1AA',
                            titleFont: { family: 'Geist', size: 13, weight: '600' },
                            bodyFont: { family: 'Geist', size: 12 },
                            padding: 12,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            boxPadding: 4,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const label = context.dataset.label || '';
                                    if (context.dataset.yAxisID === 'closeRate') {
                                        return ` ${label}: ${value}%`;
                                    }
                                    return ` ${label}: ${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false, tickLength: 0 },
                            ticks: {
                                color: 'rgba(161, 161, 170, 0.7)',
                                font: { family: 'Geist', size: 11 },
                                padding: 4
                            },
                            border: { display: false },
                            offset: hideStacks ? false : true
                        },
                        volume: {
                            type: 'linear',
                            grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false, tickLength: 0 },
                            ticks: {
                                display: !hideStacks,
                                color: 'rgba(161, 161, 170, 0.7)',
                                font: { family: 'Geist', size: 10 },
                                padding: 4,
                                callback: (value) => value
                            },
                            border: { display: false },
                            min: 0,
                            suggestedMax: 220,
                            title: {
                                display: !hideStacks,
                                text: 'Calls per day',
                                color: '#22c55e',
                                font: { family: 'Geist', size: 12, weight: '500' },
                                padding: { bottom: 4 }
                            }
                        },
                        closeRate: {
                            type: 'linear',
                            position: 'right',
                            grid: { drawOnChartArea: false, drawBorder: false, tickLength: 0 },
                            ticks: {
                                display: !hideStacks,
                                color: 'rgba(161, 161, 170, 0.7)',
                                font: { family: 'Geist', size: 10 },
                                callback: (value) => `${value}%`,
                                padding: 4
                            },
                            min: 0,
                            max: 30,
                            title: {
                                display: !hideStacks,
                                text: 'AI Close Rate',
                                color: '#38bdf8',
                                font: { family: 'Geist', size: 12, weight: '500' },
                                padding: { bottom: 4 }
                            }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        };

        waitForChart(() => {
            setup();
            if (!window.__ampFixedChartResizeBound) {
                window.__ampFixedChartResizeBound = true;
                let resizeTimeout;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(setup, 200);
                });
            }
        });
    };

    // 2. 3D Chart (AI Processing vs System Load)
    const init3DChart = () => {
        const canvas = document.getElementById('canvas-3d-ai-graph');
        if (!canvas) return;

        waitForChart(() => {
            const ctx = canvas.getContext('2d');
            
            // Rich gradients for 3D depth effect
            const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
            gradient1.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
            gradient1.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
            gradient1.addColorStop(1, 'rgba(59, 130, 246, 0)');
            
            const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
            gradient2.addColorStop(0, 'rgba(139, 92, 246, 0.7)');
            gradient2.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
            gradient2.addColorStop(1, 'rgba(139, 92, 246, 0)');

            // Grid gradient
            const gridColor = 'rgba(255, 255, 255, 0.05)';

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'AI Processing',
                            data: [35, 55, 45, 75, 60, 85, 70],
                            borderColor: '#8b5cf6',
                            backgroundColor: gradient2,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#8b5cf6',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 1
                        },
                        {
                            label: 'System Load',
                            data: [20, 40, 35, 50, 45, 60, 50],
                            borderColor: '#3b82f6',
                            backgroundColor: gradient1,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(9, 9, 11, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#A1A1AA',
                            titleFont: { family: 'Geist', size: 13, weight: '600' },
                            bodyFont: { family: 'Geist', size: 12 },
                            padding: 12,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            boxPadding: 4,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    return ' ' + context.dataset.label + ': ' + context.parsed.y + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: { 
                                color: gridColor,
                                drawBorder: false,
                                tickLength: 0
                             },
                            ticks: {
                                color: 'rgba(161, 161, 170, 0.6)',
                                font: { family: 'Geist', size: 11 },
                                padding: 10
                            },
                            border: { display: false }
                        },
                        y: {
                            display: true,
                            grid: { 
                                color: gridColor,
                                drawBorder: false 
                            },
                            ticks: { display: false },
                            border: { display: false },
                            beginAtZero: true,
                            suggestedMax: 100
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        });
    };

    // 3. Aura Chart (Total Calls vs Closed Deals)
    const initAuraChart = () => {
        const canvas = document.getElementById('canvas-aura-emjbw7gzb246u5fyi');
        if (!canvas) return;

        waitForChart(() => {
            const ctx = canvas.getContext('2d');
            
            // Gradient Setup for Dataset 1
            const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient1.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // Green-500
            gradient1.addColorStop(1, 'rgba(34, 197, 94, 0.1)');

            // Gradient Setup for Dataset 2
            const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
            gradient2.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue-500
            gradient2.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Total Calls',
                            data: [3100, 3400, 2900, 3100],
                            backgroundColor: gradient1,
                            hoverBackgroundColor: '#22c55e',
                            borderColor: '#22c55e',
                            borderWidth: 1,
                            borderRadius: 4,
                            barPercentage: 0.6,
                            categoryPercentage: 0.8,
                            order: 2
                        },
                        {
                            label: 'Closed Deals',
                            data: [620, 680, 580, 620], // 20%
                            backgroundColor: gradient2,
                            hoverBackgroundColor: '#3b82f6',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            borderRadius: 4,
                            barPercentage: 0.6,
                            categoryPercentage: 0.8,
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true,
                            position: 'top',
                            align: 'end',
                            labels: {
                                color: 'rgba(255,255,255,0.6)',
                                font: { family: 'Geist', size: 10 },
                                boxWidth: 8,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(24, 24, 27, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#A1A1AA',
                            titleFont: { family: 'Geist', size: 12, weight: '600' },
                            bodyFont: { family: 'Geist', size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            displayColors: true,
                            boxPadding: 4
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.03)' },
                            ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'Geist', size: 10 } },
                            border: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'Geist', size: 10 } },
                            border: { display: false }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    }
                }
            });
        });
    };

    // Initialize when ready
    if (document.readyState === 'complete') {
        initFixedChart();
        init3DChart();
        initAuraChart();
    } else {
        window.addEventListener('load', () => {
            initFixedChart();
            init3DChart();
            initAuraChart();
        });
    }

})();

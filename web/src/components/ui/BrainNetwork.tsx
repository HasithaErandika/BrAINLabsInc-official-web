import { useEffect, useRef } from 'react';

// Configuration
const PARTICLE_COUNT = 150;
const CONNECTION_DISTANCE = 110;
const ROTATION_SPEED = 0.002;
const BASE_COLOR = 'rgba(0, 0, 0, 0.2)';
const PULSE_COLOR = '#bebebeff';

interface Point {
    x: number;
    y: number;
    z: number;
    connections: number[];
}

interface Pulse {
    sourceIdx: number;
    targetIdx: number;
    progress: number;
    speed: number;
}

export const BrainNetwork = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointsRef = useRef<Point[]>([]);
    const pulsesRef = useRef<Pulse[]>([]);
    const animationRef = useRef<number | null>(null);

    // Interaction State
    const rotationRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDraggingRef.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        lastMousePosRef.current = { x: clientX, y: clientY };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - lastMousePosRef.current.x;
        const deltaY = clientY - lastMousePosRef.current.y;

        rotationRef.current.y += deltaX * 0.005;
        rotationRef.current.x += deltaY * 0.005;

        lastMousePosRef.current = { x: clientX, y: clientY };
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    useEffect(() => {
        // Initialize Points on a Sphere/Ellipsoid
        const points: Point[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Random point on sphere surface (approximate brain shape)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 250; // Radius

            points.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta) * 0.8, // Flatten y slightly
                z: r * Math.cos(phi),
                connections: []
            });
        }

        // Pre-calculate connections
        points.forEach((p1, i) => {
            points.forEach((p2, j) => {
                if (i >= j) return;
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONNECTION_DISTANCE) {
                    p1.connections.push(j);
                    p2.connections.push(i); // Bidirectional connection for visual graph
                }
            });
        });

        pointsRef.current = points;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth * (window.devicePixelRatio || 1);
                canvas.height = parent.clientHeight * (window.devicePixelRatio || 1);
                ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        const render = () => {
            // Use canvas.width/height to clear full buffer correctly
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get logical size for centering
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;

            // Auto-rotation only when NOT dragging
            if (!isDraggingRef.current) {
                rotationRef.current.y += ROTATION_SPEED;
            }

            const cosY = Math.cos(rotationRef.current.y);
            const sinY = Math.sin(rotationRef.current.y);
            const cosX = Math.cos(rotationRef.current.x);
            const sinX = Math.sin(rotationRef.current.x);

            // Project points 3D -> 2D
            const projectedPoints = pointsRef.current.map(p => {
                // Rotation Matrix Application
                // 1. Rotate around Y (horizontal spin)
                let x = p.x * cosY - p.z * sinY;
                let z = p.x * sinY + p.z * cosY;
                let y = p.y;

                // 2. Rotate around X (vertical tilt)
                const yOld = y;
                y = yOld * cosX - z * sinX;
                z = yOld * sinX + z * cosX;

                // Simple perspective projection
                const scale = 800 / (800 + z);
                const x2d = x * scale + centerX;
                const y2d = y * scale + centerY;
                const alpha = (scale - 0.5) * 2;

                return {
                    x: x2d,
                    y: y2d,
                    z: z,
                    alpha: Math.max(0.1, Math.min(1, alpha))
                };
            });

            // Draw Connections
            ctx.lineWidth = 1;
            pointsRef.current.forEach((p, i) => {
                const pp1 = projectedPoints[i];
                if (pp1.alpha < 0.1) return;

                p.connections.forEach(connIndex => {
                    const pp2 = projectedPoints[connIndex];
                    if (pp2.alpha < 0.1) return;

                    ctx.strokeStyle = BASE_COLOR;
                    ctx.globalAlpha = Math.min(pp1.alpha, pp2.alpha) * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(pp1.x, pp1.y);
                    ctx.lineTo(pp2.x, pp2.y);
                    ctx.stroke();
                });
            });

            // Spawn Pulses
            if (Math.random() < 0.08) {
                const sourceIdx = Math.floor(Math.random() * pointsRef.current.length);
                const source = pointsRef.current[sourceIdx];
                if (source.connections.length > 0) {
                    const targetIdx = source.connections[Math.floor(Math.random() * source.connections.length)];
                    pulsesRef.current.push({
                        sourceIdx,
                        targetIdx,
                        progress: 0,
                        speed: 0.02 + Math.random() * 0.03
                    });
                }
            }

            // Draw Pulses
            ctx.lineCap = 'round';
            for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
                const pulse = pulsesRef.current[i];
                pulse.progress += pulse.speed;

                if (pulse.progress >= 1) {
                    pulsesRef.current.splice(i, 1);
                    continue;
                }

                const p1 = projectedPoints[pulse.sourceIdx];
                const p2 = projectedPoints[pulse.targetIdx];

                if (!p1 || !p2 || p1.alpha < 0.1 || p2.alpha < 0.1) continue;

                const x = p1.x + (p2.x - p1.x) * pulse.progress;
                const y = p1.y + (p2.y - p1.y) * pulse.progress;

                ctx.globalAlpha = 1;
                ctx.shadowBlur = 8;
                ctx.shadowColor = PULSE_COLOR;
                ctx.fillStyle = PULSE_COLOR;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            style={{ minHeight: '500px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        />
    );
};

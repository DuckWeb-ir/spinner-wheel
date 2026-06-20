import { useEffect, useRef } from "react";

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

interface ConfettiCanvasProps {
  active: boolean;
}

export default function ConfettiCanvas({ active }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: ConfettiParticle[] = [];
    const colors = ["#FF5A5F", "#3A86FF", "#FFBE0B", "#8338EC", "#06D6A0", "#FF006E", "#FB5607"];

    // Set canvas dimensions
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const createParticle = (): ConfettiParticle => {
      return {
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
      };
    };

    // Populate particles initial burst
    if (active) {
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.7 - 20, // scatter initially
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: Math.random() * 6 - 3,
          speedY: Math.random() * 6 + 2,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 6 - 3,
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (active && particles.length < 100) {
        // top-up particles slowly
        particles.push(createParticle());
      }

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Draw particle (rotated rectangle or circle)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        if (i % 3 === 0) {
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Rectangle/Ribbon
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();

        // Remove offscreen particles
        if (p.y > canvas.height) {
          if (active) {
            // Reset to top
            particles[i] = createParticle();
          } else {
            particles.splice(i, 1);
          }
        }
      });

      if (active || particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  return (
    <canvas
      id="confetti-canvas"
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}

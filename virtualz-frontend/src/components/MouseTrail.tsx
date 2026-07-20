import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  age: number;
}

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const maxAge = 35; // Accorciato leggermente per rendere la scia più scattante e definita

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      pointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = pointsRef.current;

      if (points.length > 1) {
        // Generiamo il tracciato una volta sola per ottimizzare le performance
        const trailPath = new Path2D();
        trailPath.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          trailPath.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }

        // Impostazioni di unione comuni per evitare glitch grafici
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // =========================================================
        // PASSAGGIO 1: Il "Glow" Ampio (Ridotto di 1/4)
        // =========================================================
        ctx.save();
        ctx.strokeStyle = "rgba(255, 102, 196, 0.25)"; 
        ctx.lineWidth = 18;                             // Da 24 a 18
        ctx.shadowBlur = 26;                            // Da 35 a 26
        ctx.shadowColor = "#ff66c4";
        ctx.stroke(trailPath);
        ctx.restore();

        // =========================================================
        // PASSAGGIO 2: Il "Glow" Stretto (Ridotto di 1/4)
        // =========================================================
        ctx.save();
        ctx.strokeStyle = "rgba(255, 102, 196, 0.8)";  
        ctx.lineWidth = 9;                              // Da 12 a 9
        ctx.shadowBlur = 11;                            // Da 15 a 11
        ctx.shadowColor = "#ff66c4";
        ctx.stroke(trailPath);
        ctx.restore();

        // =========================================================
        // PASSAGGIO 3: Il "Core" Interno (Ridotto di 1/4)
        // =========================================================
        ctx.save();
        ctx.strokeStyle = "#ffffff";                    
        ctx.lineWidth = 2.6;                            // Da 3.5 a 2.6
        ctx.shadowBlur = 3;                             // Da 4 a 3
        ctx.shadowColor = "#ffffff";
        ctx.stroke(trailPath);
        ctx.restore();
      }

      // Invecchiamento dei punti (fade out)
      pointsRef.current = points
        .map((p) => ({ ...p, age: p.age + 1 }))
        .filter((p) => p.age < maxAge);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
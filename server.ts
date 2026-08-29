import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./server/app";

const PORT = 3000;

// --- VITE MIDDLEWARE / STATIC ASSETS ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Grill Spot server running on http://0.0.0.0:${PORT} with Cloudflare D1 integration.`);
  });
}

startServer();

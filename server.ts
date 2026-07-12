import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to generate and download the project ZIP
  app.get("/api/download-project", (req, res) => {
    try {
      const zip = new AdmZip();
      const projectRoot = process.cwd();

      // Recursive function to add files to the ZIP while skipping target folders
      function addDirectoryToZip(localPath: string, zipPath: string = "") {
        const items = fs.readdirSync(localPath);
        for (const item of items) {
          const fullLocalPath = path.join(localPath, item);
          const relativeZipPath = zipPath ? path.join(zipPath, item) : item;

          // Skip build outputs, package caches, local modules, and previous zip artifacts
          if (
            item === "node_modules" ||
            item === "dist" ||
            item === ".git" ||
            item === ".next" ||
            item.endsWith(".zip") ||
            item === "server.js"
          ) {
            continue;
          }

          const stat = fs.statSync(fullLocalPath);
          if (stat.isDirectory()) {
            addDirectoryToZip(fullLocalPath, relativeZipPath);
          } else {
            // Note: addLocalFile adds a file from filesystem.
            // Under some systems, passing the second argument (zipPath) specifies the target folder in the archive.
            zip.addLocalFile(fullLocalPath, zipPath);
          }
        }
      }

      addDirectoryToZip(projectRoot);

      // Generate buffer and send to client
      const zipBuffer = zip.toBuffer();

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="transitops_project.zip"');
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("ZIP Generation error:", error);
      res.status(500).json({ error: error.message || "Failed to package project as ZIP." });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

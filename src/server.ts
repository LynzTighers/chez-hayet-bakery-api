// Entry point for running as a normal, always-on server (Docker and `npm run dev`).
import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

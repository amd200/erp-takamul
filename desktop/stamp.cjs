// Run by `npm run desktop:build`: records when this build was made, so the app can show which build is running.
const fs = require("node:fs")
const path = require("node:path")

const built = new Date().toISOString().slice(0, 16).replace("T", " ")
fs.writeFileSync(path.join(__dirname, "build.json"), JSON.stringify({ built }))

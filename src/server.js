console.time("launch");

const express = require("express");
const path = require("path");

const PORT = 8080;

const app = express();
app.set("view engine", "ejs"); // defineeri "engine"
app.set("views", "src/views"); // defineeri "views" kausta asukoht
app.use(express.static(path.join(__dirname, "public"))); // defineeri public kaust

const { token } = require("./config.json");

app.get("/", async (req, res) => {
  res.render("index", { token });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});

console.log("Server is online.");
console.timeEnd("launch");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = mysql.createConnection({
  host: "db", // nombre del servicio en docker-compose
  user: "chatuser",
  password: "chatpass",
  database: "chatdb"
});

db.connect(err => {
  if (err) {
    console.error("Error conectando a MariaDB:", err);
  } else {
    console.log("Conectado a MariaDB");
  }
});

db.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255)
  )
`);

app.get("/", (req, res) => {
  res.send(`
    <h2>Chat Simple</h2>
    <input id="msg" />
    <button onclick="send()">Enviar</button>
    <ul id="messages"></ul>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();

      function send() {
        const msg = document.getElementById("msg").value;
        socket.emit("chat message", msg);
      }

      socket.on("chat message", msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("messages").appendChild(li);
      });
    </script>
  `);
});

io.on("connection", socket => {
  socket.on("chat message", msg => {
    db.query("INSERT INTO messages (text) VALUES (?)", [msg]);
    io.emit("chat message", msg);
  });
});

server.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});

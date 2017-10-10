process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const router = express.Router();
const path = require('path');

let answer = null;

let bunnies = {};

let bunnyWss = expressWs.getWss('/game');
app.ws('/game', function(ws, req) {
  let id = "id" + Math.random().toString().substr(2);
  while(bunnies[id]) {
    id = "id" + Math.random().toString().substr(2);
  }
  bunnies[id] = {
    x: Math.random(),
    y: Math.random()
  };
  ws.send(JSON.stringify({
    status: "INIT",
    data: {id: id}
  }));
  bunnyWss.clients.forEach(function (client) {
    client.send(JSON.stringify({
      status: "NEW_GAMER",
      data: bunnies
    }));
  });
  ws.on('message', function(msg) {
    try {
      let request = JSON.parse(msg);
      if ("MOVE" === request.status) {
        if (bunnies[request.sender]) {
          bunnies[request.sender].x = request.data.x;
          bunnies[request.sender].y = request.data.y;
        }
      }
    } catch(e) {
      console.error(e);
    }
    bunnyWss.clients.forEach(function (client) {
      client.send(msg);
    });
  });
});

app.ws('/test', function (ws, req) {
  const data = {"txt": 1};
  if (ws.OPEN === ws.readyState) {
    ws.send(JSON.stringify(data));
  }
});

app.use('/', router);

app.use(express.static('public'));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', 'pixi.js', 'dist')));

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).send('Server malfunction');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

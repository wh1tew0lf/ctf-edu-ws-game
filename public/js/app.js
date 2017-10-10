window.onload = function () {
  var id = null;
  var width = window.innerWidth - 20;
  var height = window.innerHeight - 20;
  var app = new PIXI.Application(width, height, {backgroundColor: 0x000000});
  document.body.appendChild(app.view);

// create a texture from an image path
  var texture = PIXI.Texture.fromImage('images/bunny.png');

// Scale mode for pixelation
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

  var bunnies = {};

  function createBunny(x, y, bunnyId) {

    // create our little bunny friend..
    var bunny = new PIXI.Sprite(texture);

    // enable the bunny to be interactive... this will allow it to respond to mouse and touch events
    bunny.interactive = true;

    // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
    bunny.buttonMode = true;

    // center the bunny's anchor point
    bunny.anchor.set(0.5);

    // make it a bit bigger, so it's easier to grab
    bunny.scale.set(3);

    // setup events for mouse + touch using
    // the pointer events
    if (bunnyId === id) {
      bunny
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
    }

    // move the sprite to its designated position
    bunny.x = x;
    bunny.y = y;

    // add it to the stage
    app.stage.addChild(bunny);
    return bunny;
  }

  function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
  }

  function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;
    socket.send(JSON.stringify({status: "MOVE", sender: id, data: {x: this.x, y: this.y}}));
  }

  function onDragMove() {
    if (this.dragging) {
      var newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x;
      this.y = newPosition.y;
    }
  }

  var socket = new WebSocket("ws://localhost:3000/game");
  socket.onopen = function () {
    console.log('Соединение установлено.');
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log('Соединение закрыто чисто');
    } else {
      console.log('Обрыв соединения');
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
  };

  socket.onmessage = function (event) {
    console.log("Получены данные " + event.data);
    try {
      var msg = JSON.parse(event.data);
      switch (msg.status) {
        case "INIT": 
          id = msg.data.id;
        break;
        case "NEW_GAMER":
          for(var i in msg.data) {
            console.log(msg.data);
            if (!msg.data.hasOwnProperty(i)) continue;
            if (bunnies[i]) {
              bunnies[i].x = Math.floor(msg.data[i].x * width);
              bunnies[i].y = Math.floor(msg.data[i].y * height);
            } else {
              bunnies[i] = createBunny(
                Math.floor(msg.data[i].x * width),
                Math.floor(msg.data[i].y * height),
                i
              );
            }
          }
        break;
        case "MOVE":
          if (msg.sender && bunnies[msg.sender]) {
            bunnies[msg.sender].x = msg.data.x;
            bunnies[msg.sender].y = msg.data.y;
          }
          console.log(bunnies);
        break;
      }
      
    } catch (e) {
      console.error(e);
    }
  };

  socket.onerror = function (error) {
    console.log("Ошибка " + error.message);
  };
};

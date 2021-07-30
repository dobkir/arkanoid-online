const KEYS = {
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32
};

const game = {
  running: true,
  context: null,
  width: document.querySelector("#mycanvas").getAttribute("width"),
  height: document.querySelector("#mycanvas").getAttribute("height"),
  platform: null,
  ball: null,
  score: 0,
  blocks: [],
  rows: 4,
  columns: 8,
  sprites: {
    background: null,
    ball: null,
    platform: null,
    block: null,
  },
  sounds: {
    bump: null,
    hit: null,
    fail: null,
    victory: null,
  },

  initCanvasSize() {
    let realWidth = window.innerWidth * window.devicePixelRatio;
    let realHeight = window.innerHeight * window.devicePixelRatio;
    let maxHeight = this.height;
    let maxWidth = this.width;
    // Always fully fit the width
    // It means that the final width is maxWidth, then the proportion is fair:
    // realWidth / realHeight
    // maxWidth / resultHeight
    // resultHeight = maxWidth * realHeight / realWidth
    // Round down and cut off everything above maxWidth
    this.height = Math.min(Math.floor(maxWidth * realHeight / realWidth), maxHeight);
    // responsive variant
    // this.height = Math.floor(maxWidth * realHeight / realWidth);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  },

  init() {
    this.canvas = document.getElementById("mycanvas");
    this.context = this.canvas.getContext("2d");
    this.initCanvasSize();
    this.setTextFont();
    this.setEvents();
  },

  setTextFont() {
    this.context.font = "28px Arial";
    this.context.fillStyle = "#FFFFFF";
  },

  setEvents() {
    window.addEventListener("keydown", e => {
      if (e.keyCode === KEYS.SPACE) {
        this.platform.startBall();
      } else if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.RIGHT) {
        this.platform.start(e.keyCode);
      }
    });
    window.addEventListener("keyup", e => {
      this.platform.stop();
    });
  },
  preload(callback) {
    let loadedSprites = 0;
    let loadedSounds = 0;
    let requiredResourses = Object.keys(this.sprites).length;
    requiredResourses += Object.keys(this.sounds).length;

    // Checking up that all sprites and sounds are loaded, and only then run a game
    let onResourceLoad = () => {
      ++loadedSprites;
      ++loadedSounds;
      if (loadedSprites && loadedSounds >= requiredResourses) {
        callback();
      }
    };
    this.preloadSprites(onResourceLoad);
    this.preloadAudio(onResourceLoad);
  },

  preloadSprites(onResourceLoad) {
    for (let key in this.sprites) {
      this.sprites[key] = new Image();
      this.sprites[key].src = "img/" + key + ".png";
      this.sprites[key].addEventListener("load", onResourceLoad);
    }
  },

  preloadAudio(onResourceLoad) {
    for (let key in this.sounds) {
      this.sounds[key] = new Audio("sounds/" + key + ".mp3");
      this.sounds[key].addEventListener("canplaythrough", onResourceLoad, { once: true });
    }
  },

  createBlocksArea() {
    this.ball.x = this.width / 2 - 20;
    this.ball.y = this.height - 85;
    this.platform.x = this.width / 2 - 125;
    this.platform.y = this.height - 45;

    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        this.blocks.push({
          active: true,
          width: 111,
          height: 39,
          x: 113 * column + ((this.width - 113 * this.columns) / 2),
          y: 42 * row + ((this.height - 42 * this.rows) / 2)
        });
      }
    }
  },

  renderBlocksArea() {
    for (let block of this.blocks) {
      // If the block was not destroyed by the ball, then render it.
      if (block.active) {
        this.context.drawImage(this.sprites.block, block.x, block.y);
      }
    }
  },

  updateSprites() {
    this.collideBallAndBlocks();
    this.collideBallAndPlatform();
    this.platform.collideCanvasBounds();
    this.platform.move();
    this.ball.collideCanvasBounds();
    this.ball.move();
  },

  addScore() {
    ++this.score;
    // When the counter shows that blocks are ended, finish the game
    if (this.score >= this.blocks.length) {
      const victory = this.endGame("victory", "You win!");
      return victory;
    }
  },

  collideBallAndBlocks() {
    for (let block of this.blocks) {
      // If the block was not destroyed by the ball, and collide with it, then:
      if (block.active && this.ball.collide(block)) {
        this.ball.bumpBlock(block);
        // When a ball has been colliding the block, add scores in the method addScore()
        this.addScore();
        this.sounds.hit.play();
      }
    }
  },

  collideBallAndPlatform() {
    if (this.ball.collide(this.platform)) {
      this.ball.bumpPlatform(this.platform);
      this.sounds.bump.play();
    }
  },

  renderSprites() {
    // Clear sprites rectangles before each new rendering
    this.context.clearRect(0, 0, this.width, this.height);
    // Rendering of the background
    this.context.drawImage(this.sprites.background, 0, 0);
    // The first frame of the animation.
    this.context.drawImage(this.sprites.ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
    this.context.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
    this.renderBlocksArea();
    this.context.fillText("Score: " + this.score, 70, 46);
  },

  runGame() {
    // When running is true, it means that the game is running
    if (this.running) {
      // Calls itself recursively for each frame of the animation.
      window.requestAnimationFrame(() => {
        this.updateSprites();
        this.renderSprites();
        this.runGame();
      });
    }
  },

  startGame() {
    this.init();
    this.preload(() => {
      this.createBlocksArea();
      this.runGame();
    });
  },

  handler(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  endGameEvent(sound, message) {
    game.sounds[sound].play();
    alert(message);
  },

  reloadGame() {
    this.running = false;
    window.location.reload();
  },

  endGame(sound, message) {
    this.endGameEvent(sound, message);

    this.reloadGame();

    this.handler();
  },

  random(min, max) {
    // Get a random integer in a given range
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
};


window.addEventListener("load", () => {
  game.startGame();
});

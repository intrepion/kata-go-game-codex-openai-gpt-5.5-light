(function (root) {
  "use strict";

  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  const COLORS = {
    [BLACK]: "Black",
    [WHITE]: "White"
  };

  function opponent(color) {
    return color === BLACK ? WHITE : BLACK;
  }

  function createBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(EMPTY));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function boardKey(board) {
    return board.map((row) => row.join("")).join("/");
  }

  function pointLabel(point) {
    return `${String.fromCharCode(65 + point.x)}${point.y + 1}`;
  }

  class GoGame {
    constructor(options = {}) {
      this.newGame(options);
    }

    newGame(options = {}) {
      const size = Number(options.size || 9);
      this.size = [9, 13, 19].includes(size) ? size : 9;
      this.komi = Number.isFinite(Number(options.komi)) ? Number(options.komi) : 6.5;
      this.board = createBoard(this.size);
      this.currentPlayer = BLACK;
      this.captures = { [BLACK]: 0, [WHITE]: 0 };
      this.moveHistory = [];
      this.positionHistory = new Set([boardKey(this.board)]);
      this.lastMove = null;
      this.lastCaptures = [];
      this.koPoint = null;
      this.consecutivePasses = 0;
      this.gameOver = false;
      this.result = null;
      this.message = "Black to play.";
      return this.snapshot();
    }

    play(x, y) {
      if (this.gameOver) {
        return this.reject("The game is over. Start a new game to play again.");
      }
      if (!this.isOnBoard(x, y)) {
        return this.reject("Move is outside the board.");
      }
      if (this.board[y][x] !== EMPTY) {
        return this.reject("That intersection is occupied.");
      }

      this.board[y][x] = this.currentPlayer;
      const captured = [];
      for (const neighbor of this.neighbors(x, y)) {
        if (this.board[neighbor.y][neighbor.x] !== opponent(this.currentPlayer)) {
          continue;
        }
        const group = this.collectGroup(neighbor.x, neighbor.y);
        if (group.liberties.size === 0) {
          for (const stone of group.stones) {
            this.board[stone.y][stone.x] = EMPTY;
            captured.push(stone);
          }
        }
      }

      const ownGroup = this.collectGroup(x, y);
      if (ownGroup.liberties.size === 0) {
        this.board[y][x] = EMPTY;
        for (const stone of captured) {
          this.board[stone.y][stone.x] = opponent(this.currentPlayer);
        }
        return this.reject("Illegal suicide: that move leaves the placed group with no liberties.");
      }

      const nextKey = boardKey(this.board);
      if (this.positionHistory.has(nextKey)) {
        this.board[y][x] = EMPTY;
        for (const stone of captured) {
          this.board[stone.y][stone.x] = opponent(this.currentPlayer);
        }
        return this.reject("Illegal ko: that move repeats an earlier board position.");
      }

      const move = {
        type: "play",
        color: this.currentPlayer,
        x,
        y,
        label: pointLabel({ x, y }),
        captures: captured.map((stone) => ({ ...stone }))
      };
      this.captures[this.currentPlayer] += captured.length;
      this.moveHistory.push(move);
      this.positionHistory.add(nextKey);
      this.lastMove = { x, y, color: this.currentPlayer };
      this.lastCaptures = captured.map((stone) => ({ ...stone }));
      this.koPoint = captured.length === 1 ? { ...captured[0] } : null;
      this.consecutivePasses = 0;
      this.currentPlayer = opponent(this.currentPlayer);
      this.message = captured.length > 0
        ? `${COLORS[move.color]} captured ${captured.length}. ${COLORS[this.currentPlayer]} to play.`
        : `${COLORS[this.currentPlayer]} to play.`;
      return { ok: true, move, snapshot: this.snapshot() };
    }

    pass() {
      if (this.gameOver) {
        return this.reject("The game is over. Start a new game to play again.");
      }
      const passingPlayer = this.currentPlayer;
      const move = { type: "pass", color: passingPlayer };
      this.moveHistory.push(move);
      this.lastMove = null;
      this.lastCaptures = [];
      this.koPoint = null;
      this.consecutivePasses += 1;

      if (this.consecutivePasses >= 2) {
        this.gameOver = true;
        this.result = this.scoreGame();
        this.message = `${this.result.winnerName} wins by ${this.result.margin.toFixed(1)}.`;
      } else {
        this.currentPlayer = opponent(this.currentPlayer);
        this.message = `${COLORS[passingPlayer]} passed. ${COLORS[this.currentPlayer]} to play.`;
      }

      return { ok: true, move, snapshot: this.snapshot() };
    }

    resign() {
      if (this.gameOver) {
        return this.reject("The game is over. Start a new game to play again.");
      }
      const resigned = this.currentPlayer;
      const winner = opponent(resigned);
      const move = { type: "resign", color: resigned };
      this.moveHistory.push(move);
      this.gameOver = true;
      this.result = {
        type: "resignation",
        winner,
        winnerName: COLORS[winner],
        resigned,
        black: null,
        white: null,
        margin: null,
        territory: createBoard(this.size)
      };
      this.message = `${COLORS[resigned]} resigned. ${COLORS[winner]} wins.`;
      return { ok: true, move, snapshot: this.snapshot() };
    }

    reject(reason) {
      this.message = reason;
      return { ok: false, reason, snapshot: this.snapshot() };
    }

    isOnBoard(x, y) {
      return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.size && y < this.size;
    }

    neighbors(x, y) {
      return [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ].filter((point) => this.isOnBoard(point.x, point.y));
    }

    collectGroup(x, y) {
      const color = this.board[y][x];
      const stack = [{ x, y }];
      const seen = new Set();
      const stones = [];
      const liberties = new Set();

      while (stack.length > 0) {
        const point = stack.pop();
        const key = `${point.x},${point.y}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        stones.push(point);
        for (const neighbor of this.neighbors(point.x, point.y)) {
          const value = this.board[neighbor.y][neighbor.x];
          if (value === EMPTY) {
            liberties.add(`${neighbor.x},${neighbor.y}`);
          } else if (value === color) {
            stack.push(neighbor);
          }
        }
      }

      return { stones, liberties };
    }

    libertiesAt(x, y) {
      if (!this.isOnBoard(x, y) || this.board[y][x] === EMPTY) {
        return [];
      }
      return Array.from(this.collectGroup(x, y).liberties).map((key) => {
        const [px, py] = key.split(",").map(Number);
        return { x: px, y: py };
      });
    }

    scoreGame() {
      const visited = new Set();
      let black = 0;
      let white = this.komi;
      const territory = createBoard(this.size);

      for (let y = 0; y < this.size; y += 1) {
        for (let x = 0; x < this.size; x += 1) {
          const value = this.board[y][x];
          if (value === BLACK) {
            black += 1;
          } else if (value === WHITE) {
            white += 1;
          } else {
            const key = `${x},${y}`;
            if (visited.has(key)) {
              continue;
            }
            const region = this.collectEmptyRegion(x, y, visited);
            if (region.borders.size === 1 && region.borders.has(BLACK)) {
              black += region.points.length;
              for (const point of region.points) {
                territory[point.y][point.x] = BLACK;
              }
            } else if (region.borders.size === 1 && region.borders.has(WHITE)) {
              white += region.points.length;
              for (const point of region.points) {
                territory[point.y][point.x] = WHITE;
              }
            }
          }
        }
      }

      const winner = black > white ? BLACK : WHITE;
      const margin = Math.abs(black - white);
      return {
        type: "score",
        black,
        white,
        winner,
        winnerName: COLORS[winner],
        margin,
        territory
      };
    }

    collectEmptyRegion(x, y, visited) {
      const stack = [{ x, y }];
      const points = [];
      const borders = new Set();

      while (stack.length > 0) {
        const point = stack.pop();
        const key = `${point.x},${point.y}`;
        if (visited.has(key)) {
          continue;
        }
        visited.add(key);
        points.push(point);

        for (const neighbor of this.neighbors(point.x, point.y)) {
          const value = this.board[neighbor.y][neighbor.x];
          if (value === EMPTY) {
            stack.push(neighbor);
          } else {
            borders.add(value);
          }
        }
      }

      return { points, borders };
    }

    snapshot() {
      return {
        size: this.size,
        komi: this.komi,
        board: cloneBoard(this.board),
        currentPlayer: this.currentPlayer,
        captures: { ...this.captures },
        moveHistory: this.moveHistory.map((move) => ({ ...move })),
        lastMove: this.lastMove ? { ...this.lastMove } : null,
        lastCaptures: this.lastCaptures.map((stone) => ({ ...stone })),
        koPoint: this.koPoint ? { ...this.koPoint } : null,
        consecutivePasses: this.consecutivePasses,
        gameOver: this.gameOver,
        result: this.result ? {
          ...this.result,
          territory: this.result.territory ? cloneBoard(this.result.territory) : null
        } : null,
        message: this.message
      };
    }
  }

  class GoGameUI {
    constructor(documentRef) {
      this.document = documentRef;
      this.canvas = documentRef.getElementById("board");
      this.context = this.canvas.getContext("2d");
      this.status = documentRef.getElementById("status");
      this.boardSize = documentRef.getElementById("board-size");
      this.komi = documentRef.getElementById("komi");
      this.form = documentRef.getElementById("setup-form");
      this.moveList = documentRef.getElementById("move-list");
      this.boardLabel = documentRef.getElementById("board-label");
      this.blackCaptures = documentRef.getElementById("black-captures");
      this.whiteCaptures = documentRef.getElementById("white-captures");
      this.passButton = documentRef.getElementById("pass-button");
      this.resignButton = documentRef.getElementById("resign-button");
      this.scoreCard = documentRef.getElementById("score-card");
      this.scoreSummary = documentRef.getElementById("score-summary");
      this.hoverPoint = null;
      this.game = new GoGame({
        size: Number(this.boardSize.value),
        komi: Number(this.komi.value)
      });
      this.bind();
      this.render();
    }

    bind() {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.game.newGame({
          size: Number(this.boardSize.value),
          komi: Number(this.komi.value)
        });
        this.hoverPoint = null;
        this.render();
      });

      this.canvas.addEventListener("pointermove", (event) => {
        this.hoverPoint = this.eventToPoint(event);
        this.render();
      });

      this.canvas.addEventListener("pointerleave", () => {
        this.hoverPoint = null;
        this.render();
      });

      this.canvas.addEventListener("click", (event) => {
        const point = this.eventToPoint(event);
        if (!point) {
          return;
        }
        this.game.play(point.x, point.y);
        this.hoverPoint = point;
        this.render();
      });

      this.passButton.addEventListener("click", () => {
        this.game.pass();
        this.hoverPoint = null;
        this.render();
      });

      this.resignButton.addEventListener("click", () => {
        this.game.resign();
        this.hoverPoint = null;
        this.render();
      });
    }

    eventToPoint(event) {
      const rect = this.canvas.getBoundingClientRect();
      const layout = this.boardLayout();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      const gx = Math.round((x - layout.margin) / layout.gap);
      const gy = Math.round((y - layout.margin) / layout.gap);
      const snapX = layout.margin + gx * layout.gap;
      const snapY = layout.margin + gy * layout.gap;
      const radius = Math.max(14, layout.gap * 0.42);
      if (!this.game.isOnBoard(gx, gy)) {
        return null;
      }
      if (Math.hypot(x - snapX, y - snapY) > radius) {
        return null;
      }
      return { x: gx, y: gy };
    }

    boardLayout() {
      const margin = 44;
      const span = this.canvas.width - margin * 2;
      return {
        margin,
        gap: span / (this.game.size - 1),
        stoneRadius: Math.max(9, (span / (this.game.size - 1)) * 0.42)
      };
    }

    render() {
      const snapshot = this.game.snapshot();
      this.status.textContent = snapshot.message;
      this.status.classList.toggle("is-warning", /occupied|outside|suicide|ko/i.test(snapshot.message));
      this.boardLabel.textContent = `${snapshot.size}x${snapshot.size}`;
      this.blackCaptures.textContent = String(snapshot.captures[BLACK]);
      this.whiteCaptures.textContent = String(snapshot.captures[WHITE]);
      this.passButton.disabled = snapshot.gameOver;
      this.resignButton.disabled = snapshot.gameOver;
      this.renderScore(snapshot);
      this.renderMoveList(snapshot);
      this.drawBoard(snapshot);
    }

    renderScore(snapshot) {
      if (!snapshot.result || snapshot.result.type !== "score") {
        this.scoreCard.hidden = !snapshot.result;
        this.scoreSummary.textContent = snapshot.result
          ? `${snapshot.result.winnerName} wins by resignation.`
          : "";
        return;
      }

      this.scoreCard.hidden = false;
      this.scoreSummary.textContent = `Black ${snapshot.result.black.toFixed(1)} - White ${snapshot.result.white.toFixed(1)}. ${snapshot.result.winnerName} wins by ${snapshot.result.margin.toFixed(1)}.`;
    }

    renderMoveList(snapshot) {
      this.moveList.replaceChildren();
      for (const move of snapshot.moveHistory) {
        const item = this.document.createElement("li");
        if (move.type === "pass") {
          item.textContent = `${COLORS[move.color]} pass`;
        } else if (move.type === "resign") {
          item.textContent = `${COLORS[move.color]} resigns`;
        } else {
          const captureText = move.captures && move.captures.length > 0 ? ` x${move.captures.length}` : "";
          item.textContent = `${COLORS[move.color]} ${move.label}${captureText}`;
        }
        this.moveList.appendChild(item);
      }
    }

    drawBoard(snapshot) {
      const ctx = this.context;
      const layout = this.boardLayout();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      gradient.addColorStop(0, "#e6bd73");
      gradient.addColorStop(1, "#bf7d3d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.strokeStyle = "#55391f";
      ctx.lineWidth = 2;
      for (let index = 0; index < snapshot.size; index += 1) {
        const position = layout.margin + index * layout.gap;
        ctx.beginPath();
        ctx.moveTo(layout.margin, position);
        ctx.lineTo(this.canvas.width - layout.margin, position);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(position, layout.margin);
        ctx.lineTo(position, this.canvas.height - layout.margin);
        ctx.stroke();
      }

      this.drawStarPoints(snapshot.size, layout);

      for (let y = 0; y < snapshot.size; y += 1) {
        for (let x = 0; x < snapshot.size; x += 1) {
          if (snapshot.board[y][x] !== EMPTY) {
            this.drawStone(x, y, snapshot.board[y][x], layout, 1);
          }
        }
      }

      if (this.hoverPoint && snapshot.board[this.hoverPoint.y][this.hoverPoint.x] === EMPTY) {
        this.drawStone(this.hoverPoint.x, this.hoverPoint.y, snapshot.currentPlayer, layout, 0.46);
      }

      this.drawRuleMarkers(snapshot, layout);
      this.drawTerritory(snapshot, layout);
    }

    drawStarPoints(size, layout) {
      const points = size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15];
      const ctx = this.context;
      ctx.fillStyle = "rgba(74, 48, 25, 0.78)";
      for (const x of points) {
        for (const y of points) {
          if (size === 9 && x !== 4 && y !== 4) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(layout.margin + x * layout.gap, layout.margin + y * layout.gap, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawStone(x, y, color, layout, alpha) {
      const ctx = this.context;
      const cx = layout.margin + x * layout.gap;
      const cy = layout.margin + y * layout.gap;
      const radius = layout.stoneRadius;
      ctx.save();
      ctx.globalAlpha = alpha;
      const gradient = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.45, radius * 0.2, cx, cy, radius);
      if (color === BLACK) {
        gradient.addColorStop(0, "#55504b");
        gradient.addColorStop(1, "#090807");
      } else {
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#c9c2b8");
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawRuleMarkers(snapshot, layout) {
      const ctx = this.context;
      if (snapshot.lastMove) {
        const cx = layout.margin + snapshot.lastMove.x * layout.gap;
        const cy = layout.margin + snapshot.lastMove.y * layout.gap;
        ctx.strokeStyle = snapshot.lastMove.color === BLACK ? "#f7efe2" : "#24201b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, layout.stoneRadius * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const stone of snapshot.lastCaptures) {
        const cx = layout.margin + stone.x * layout.gap;
        const cy = layout.margin + stone.y * layout.gap;
        ctx.strokeStyle = "#a53e32";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, layout.stoneRadius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (snapshot.koPoint) {
        const cx = layout.margin + snapshot.koPoint.x * layout.gap;
        const cy = layout.margin + snapshot.koPoint.y * layout.gap;
        ctx.fillStyle = "rgba(165, 62, 50, 0.9)";
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawTerritory(snapshot, layout) {
      if (!snapshot.result || snapshot.result.type !== "score" || !snapshot.result.territory) {
        return;
      }
      const ctx = this.context;
      for (let y = 0; y < snapshot.size; y += 1) {
        for (let x = 0; x < snapshot.size; x += 1) {
          const owner = snapshot.result.territory[y][x];
          if (owner === EMPTY) {
            continue;
          }
          const cx = layout.margin + x * layout.gap;
          const cy = layout.margin + y * layout.gap;
          ctx.fillStyle = owner === BLACK ? "rgba(20, 18, 15, 0.24)" : "rgba(255, 255, 255, 0.46)";
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
    }
  }

  const api = { GoGame, constants: { EMPTY, BLACK, WHITE } };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.GoGame = GoGame;
  root.goGameApi = api;

  if (root.document) {
    root.addEventListener("DOMContentLoaded", () => {
      root.goGameUI = new GoGameUI(root.document);
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

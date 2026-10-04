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
      this.lastMove = null;
      this.message = "Black to play.";
      return this.snapshot();
    }

    play(x, y) {
      if (!this.isOnBoard(x, y)) {
        return this.reject("Move is outside the board.");
      }
      if (this.board[y][x] !== EMPTY) {
        return this.reject("That intersection is occupied.");
      }

      this.board[y][x] = this.currentPlayer;
      const move = {
        type: "play",
        color: this.currentPlayer,
        x,
        y,
        label: pointLabel({ x, y })
      };
      this.moveHistory.push(move);
      this.lastMove = { x, y, color: this.currentPlayer };
      this.currentPlayer = opponent(this.currentPlayer);
      this.message = `${COLORS[this.currentPlayer]} to play.`;
      return { ok: true, move, snapshot: this.snapshot() };
    }

    reject(reason) {
      this.message = reason;
      return { ok: false, reason, snapshot: this.snapshot() };
    }

    isOnBoard(x, y) {
      return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.size && y < this.size;
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
      this.status.classList.toggle("is-warning", /occupied|outside/i.test(snapshot.message));
      this.boardLabel.textContent = `${snapshot.size}x${snapshot.size}`;
      this.blackCaptures.textContent = String(snapshot.captures[BLACK]);
      this.whiteCaptures.textContent = String(snapshot.captures[WHITE]);
      this.renderMoveList(snapshot);
      this.drawBoard(snapshot);
    }

    renderMoveList(snapshot) {
      this.moveList.replaceChildren();
      for (const move of snapshot.moveHistory) {
        const item = this.document.createElement("li");
        item.textContent = `${COLORS[move.color]} ${move.label}`;
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

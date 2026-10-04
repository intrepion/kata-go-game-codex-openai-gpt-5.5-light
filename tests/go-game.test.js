const test = require("node:test");
const assert = require("node:assert/strict");
const { GoGame, constants } = require("../game.js");

test("new local game supports selected board size and komi", () => {
  const game = new GoGame({ size: 13, komi: 6.5 });
  const state = game.snapshot();

  assert.equal(state.size, 13);
  assert.equal(state.komi, 6.5);
  assert.equal(state.board.length, 13);
  assert.equal(state.currentPlayer, constants.BLACK);
});

test("players place stones on empty intersections in alternating turns", () => {
  const game = new GoGame({ size: 9 });

  assert.equal(game.play(2, 3).ok, true);
  assert.equal(game.play(4, 3).ok, true);
  const state = game.snapshot();

  assert.equal(state.board[3][2], constants.BLACK);
  assert.equal(state.board[3][4], constants.WHITE);
  assert.equal(state.currentPlayer, constants.BLACK);
  assert.deepEqual(
    state.moveHistory.map((move) => `${move.color}:${move.label}`),
    [`${constants.BLACK}:C4`, `${constants.WHITE}:E4`]
  );
});

test("occupied intersections are rejected without changing turns", () => {
  const game = new GoGame({ size: 9 });

  assert.equal(game.play(0, 0).ok, true);
  const result = game.play(0, 0);
  const state = game.snapshot();

  assert.equal(result.ok, false);
  assert.match(result.reason, /occupied/i);
  assert.equal(state.currentPlayer, constants.WHITE);
  assert.equal(state.moveHistory.length, 1);
});

test("a surrounded opposing group is captured and removed", () => {
  const game = new GoGame({ size: 9 });

  game.play(1, 0); // Black
  game.play(1, 1); // White
  game.play(0, 1); // Black
  game.play(4, 4); // White
  game.play(2, 1); // Black
  game.play(5, 5); // White
  const result = game.play(1, 2); // Black captures White at B2
  const state = game.snapshot();

  assert.equal(result.ok, true);
  assert.equal(state.board[1][1], constants.EMPTY);
  assert.equal(state.captures[constants.BLACK], 1);
  assert.equal(state.lastCaptures.length, 1);
});

test("suicide moves are illegal when they capture no opposing stones", () => {
  const game = new GoGame({ size: 9 });

  game.play(1, 0); // Black
  game.play(4, 4); // White
  game.play(0, 1); // Black
  game.play(5, 5); // White
  game.play(2, 1); // Black
  game.play(6, 6); // White
  game.play(1, 2); // Black
  const result = game.play(1, 1); // White suicide
  const state = game.snapshot();

  assert.equal(result.ok, false);
  assert.match(result.reason, /suicide/i);
  assert.equal(state.board[1][1], constants.EMPTY);
  assert.equal(state.currentPlayer, constants.WHITE);
});

test("ko rejects an immediate board repetition", () => {
  const game = new GoGame({ size: 9 });

  game.play(1, 0); // B
  game.play(2, 0); // W
  game.play(0, 1); // B
  game.play(3, 1); // W
  game.play(1, 2); // B
  game.play(2, 2); // W
  game.play(4, 4); // B elsewhere
  game.play(1, 1); // W into atari
  const capture = game.play(2, 1); // B captures W at B2
  const recapture = game.play(1, 1); // W immediate ko recapture

  assert.equal(capture.ok, true);
  assert.equal(recapture.ok, false);
  assert.match(recapture.reason, /ko/i);
});

test("ko does not reject a later repeated position after an intervening move", () => {
  const game = new GoGame({ size: 9 });

  game.play(1, 0); // B
  game.play(2, 0); // W
  game.play(0, 1); // B
  game.play(3, 1); // W
  game.play(1, 2); // B
  game.play(2, 2); // W
  game.play(4, 4); // B
  game.play(1, 1); // W
  game.play(2, 1); // B captures W at B2
  game.play(8, 8); // W ko threat elsewhere
  game.play(7, 7); // B answers elsewhere
  const recapture = game.play(1, 1); // W recaptures after intervening moves

  assert.equal(recapture.ok, true);
});

test("two consecutive passes end the game and score with komi", () => {
  const game = new GoGame({ size: 9, komi: 6.5 });

  assert.equal(game.pass().ok, true);
  const result = game.pass();
  const state = game.snapshot();

  assert.equal(result.ok, true);
  assert.equal(state.gameOver, true);
  assert.equal(state.result.type, "score");
  assert.equal(state.result.black, 0);
  assert.equal(state.result.white, 6.5);
  assert.equal(state.result.winner, constants.WHITE);
});

test("resignation immediately ends the game for the opponent", () => {
  const game = new GoGame({ size: 9 });

  const result = game.resign();
  const state = game.snapshot();

  assert.equal(result.ok, true);
  assert.equal(state.gameOver, true);
  assert.equal(state.result.type, "resignation");
  assert.equal(state.result.winner, constants.WHITE);
  assert.match(state.message, /resigned/i);
});

test("undo restores the previous local game state", () => {
  const game = new GoGame({ size: 9 });

  game.play(0, 0);
  game.play(1, 0);
  const undo = game.undo();
  const state = game.snapshot();

  assert.equal(undo.ok, true);
  assert.equal(state.board[0][0], constants.BLACK);
  assert.equal(state.board[0][1], constants.EMPTY);
  assert.equal(state.currentPlayer, constants.WHITE);
  assert.equal(state.moveHistory.length, 1);
});

test("serialized unfinished game restores board and undo history", () => {
  const game = new GoGame({ size: 13, komi: 7.5 });
  game.play(3, 3);
  game.play(4, 3);

  const restored = new GoGame();
  restored.restore(game.serialize());
  restored.undo();
  const state = restored.snapshot();

  assert.equal(state.size, 13);
  assert.equal(state.komi, 7.5);
  assert.equal(state.board[3][3], constants.BLACK);
  assert.equal(state.board[3][4], constants.EMPTY);
  assert.equal(state.currentPlayer, constants.WHITE);
});

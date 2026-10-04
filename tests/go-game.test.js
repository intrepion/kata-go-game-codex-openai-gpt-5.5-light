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

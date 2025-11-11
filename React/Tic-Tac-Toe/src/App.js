// Import the useState hook from React.
// Hooks are special functions that let you add state (data that changes over time)
// and other React features to function components.
import { useState } from 'react';

// ---------------- Square Component ----------------
// Square is a small reusable component that represents one cell (button) in the Tic-Tac-Toe board.
// It receives two props:
//   - value: The text to display inside the square ('X', 'O', or null).
//   - onSquareClick: A function to run when the square is clicked.
//
// Note: Component names must start with a capital letter in React.
function Square({ value, onSquareClick }) {
  return (
    // A <button> element represents one square.
    // - "className" is used instead of "class" (since "class" is a reserved word in JavaScript).
    // - The onClick event is handled by calling the function passed in as "onSquareClick".
    // - {value} is inside curly braces because in JSX, curly braces let you embed JavaScript expressions into HTML-like code.
    // - Instead of writing {value ? value : ""}, React automatically renders null as empty.
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

// ---------------- Board Component ----------------
// The Board is the main component that holds the game state and renders 9 squares.
export default function Board() {
  // xIsNext: Boolean state that tracks whose turn it is.
  // If true → X's turn, if false → O's turn.
  const [xIsNext, setXIsNext] = useState(true);

  // squares: An array of 9 elements (one for each square).
  // Each element can be 'X', 'O', or null (empty square).
  const [squares, setSquares] = useState(Array(9).fill(null));

  // handleClick(i) is called whenever a square is clicked.
  // 'i' is the index of the square in the squares array.
  function handleClick(i) {
    // If the game already has a winner OR this square is already filled, ignore the click.
    if (calculateWinner(squares) || squares[i]) {
      return;
    }

    // Make a copy of the current squares array (important for immutability in React).
    const nextSquares = squares.slice();

    // Place 'X' or 'O' in the clicked square based on whose turn it is.
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }

    // Update the state with the new squares and switch turns.
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  // Determine if there's a winner using the helper function below.
  const winner = calculateWinner(squares);

  // Status message shown at the top of the board.
  // It either shows the winner or whose turn is next.
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  // Return the UI for the board.
  // React fragments (<></>) let you group elements without adding an extra div in the DOM.
  return (
    <>
      {/* Display game status */}
      <div className="status">{status}</div>

      {/* Each row contains 3 Square components */}
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

// ---------------- Helper Function: calculateWinner ----------------
// This function checks all possible winning combinations for Tic-Tac-Toe.
// If three squares in a line (row, column, or diagonal) have the same non-null value,
// that value ('X' or 'O') is returned as the winner.
function calculateWinner(squares) {
  // All possible winning lines in a 3x3 grid.
  const lines = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
  ];

  // Loop over each line and check if the 3 squares match.
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // If squares[a] is not null AND all three squares have the same value → winner found.
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }

  // If no winner, return null.
  return null;
}

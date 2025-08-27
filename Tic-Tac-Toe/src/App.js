// Define a functional React component named 'Square'.
// Functional components are the preferred way to write components in modern React,
// especially when combined with hooks for state and lifecycle management.

// We're using function Square() instead of an arrow function (const Square = () => {}).
// Both are valid, but function declarations are hoisted, which can be useful in some cases.

// Export Default: This makes Square the default export of the module
// allowing it to be imported without curly braces:

// JSX isn’t native JavaScript — it’s transformed by Babel into: React.createElement('button', { className: 'square' }, 'X');



// export default function Square() {
//   // Return a JSX element: a <button> with the class 'square' and the text 'X'.
//   // JSX is a syntax extension that lets you write HTML-like code inside JavaScript.
//   // The 'className' attribute is used instead of 'class' because 'class' is a reserved word in JS.
//   return <button className="square">X</button>;
// }

import { useState } from "react";

function Square({ value }) {
  return <button className="square">{value}</button>;
}

export default function Board() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  return (
    <>
      <div className="board-row">
        <Square value={squares[0]} />
        <Square value={squares[1]} />
        <Square value={squares[2]} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} />
        <Square value={squares[4]} />
        <Square value={squares[5]} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} />
        <Square value={squares[7]} />
        <Square value={squares[8]} />
      </div>
    </>
  );
}

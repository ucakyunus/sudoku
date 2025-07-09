# Sudoku Game

A modern, responsive Sudoku game built with Vue 3, TypeScript, and Tailwind CSS. Features multiple difficulty levels, scoring system, hints, and a leaderboard.

## Features

### Core Game Features

- **4 Difficulty Levels**: Beginner (36-40 cells), Intermediate (32-36 cells), Hard (28-32 cells), Expert (24-28 cells)
- **Random puzzle generation**: Every game is unique
- **Immediate error detection**: Invalid moves are highlighted instantly
- **Keyboard and mouse controls**: Navigate with arrow keys or click cells
- **Draft mode**: Hold Shift/Ctrl while entering numbers to add draft notes

### Scoring System

- **Part 1 - During Game**:

  - +5 points for each correct cell
  - -3 points for first hint (then -4, -5, etc.)
  - -1 point for each error

- **Part 2 - Time Bonus**:
  - (500 - seconds elapsed) added to final score

### Additional Features

- **Hint System**: Up to 10 hints available (with scoring penalties)
- **Undo/Redo**: Undo your last moves
- **Pause/Resume**: Game auto-pauses when you switch tabs
- **Records Board**: Top 3 scores for each difficulty level persist across sessions
- **Available Digits**: Shows remaining digits otherwise when its done show as disable
- **Animations**: Completed rows, columns, and 3x3 blocks animate
- **Responsive Design**: Works on desktop and mobile devices

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd sudoku

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run unit tests
yarn test:unit
```

## How to Play

1. **Start a new game** by selecting a difficulty level
2. **Click a cell** or use arrow keys to navigate
3. **Enter numbers 1-9** to fill cells
4. **Hold Shift/Ctrl** while entering numbers for draft mode
5. **Use hints** when stuck (costs points)
6. **Complete the puzzle** with all correct numbers to win!

### Controls

- **Number Keys (1-9)**: Enter a number in the selected cell
- **Shift/Ctrl + Number**: Enter draft/pencil marks
- **Delete/Backspace**: Clear cell
- **Arrow Keys**: Navigate between cells
- **Escape**: Clear draft marks

## Technical Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Vitest** for unit testing
- **Vite** for fast builds

## Project Structure

```
src/
├── components/        # Vue components
│   ├── SudokuBoard.vue
│   ├── SudokuCell.vue
│   ├── GameControls.vue
│   ├── GameStats.vue
│   ├── NumberPad.vue
│   ├── SudokuLeaderboard.vue
│   └── ...
├── stores/           # Pinia stores
│   ├── game.ts       # Game state management
│   └── records.ts    # Leaderboard records
├── types/            # TypeScript types
│   └── sudoku.ts     # Game type definitions
├── utils/            # Utility functions
│   ├── sudokuGenerator.ts  # Puzzle generation
│   └── sudokuValidator.ts  # Move validation
└── views/            # Page components
    └── SudokuView.vue

```

## Algorithm Details

The game uses a backtracking algorithm for:

- **Puzzle Generation**: Creates a valid complete Sudoku solution
- **Puzzle Creation**: Removes cells while ensuring unique solution
- **Validation**: Checks moves against Sudoku rules in real-time

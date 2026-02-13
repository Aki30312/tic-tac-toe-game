# 🎮 Tic Tac Toe (Solo or Duo)

A fully responsive and animated Tic Tac Toe game built using **HTML, CSS, and JavaScript** with smart AI logic and interactive UI feedback.

---

## ✅ Features

* **Single Player** vs Computer (smart win/block logic)
* **Two Player** mode
* Player name inputs
* Score tracking (X vs O)
* Win detection + draw detection
* End-game modal popup
* Win line + cell highlight animation
* Confetti celebration on win 🎉
* Optional sound effects (win, draw, click) 🔊
* Fully responsive layout (mobile-friendly)

---

## 📁 Folder Structure

```
tic-tac-toe/
│── index.html
│── style.css
│── script.js
│── assets/
│   ├── x-icon.png
│   ├── o-icon.png
│   ├── win.mp3
│   ├── draw.mp3
│   └── click.mp3 
└── README.md
```

---

## ▶️ How to Run

1. Download or clone the project folder.
2. Open **index.html** in your browser.
3. Choose a mode (Single Player or Two Player).
4. Enter player name(s) and click **Start Game**.

---

## 🎯 How to Play

* Player **X always starts first**.
* Click any empty cell to place your mark.
* First player to get **3 in a row** wins.
* If all cells are filled with no winner → **Draw**.

---

## 🧠 AI Logic (Single Player)

The computer follows this priority:

1. ✅ Win if possible
2. 🛑 Block the player’s winning move
3. 🎯 Choose best available position

   * Center
   * Corners
   * Sides

---

## 🛠 Built With

* **HTML5**
* **CSS3** (Flexbox, Grid, Animations, Media Queries)
* **JavaScript** (DOM Manipulation, Event Handling, Game Logic)

---

## ✨ Notes

 
* All media files must be placed inside the **assets/** folder.
* The game is fully responsive and works on mobile, tablet, and desktop.

---

## 👩‍💻 Author

Built as part of the **Nexus Front-End Boot Camp Project**.

---

  
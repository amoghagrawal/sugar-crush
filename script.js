const GRID_SIZE = 8;
const CANDY_TYPES = [{
    image: 'assets/candies/2.png',
    symbol: 'ice'
}, {
    image: 'assets/candies/7.png',
    symbol: 'cookie'
}, {
    image: 'assets/candies/8.png',
    symbol: 'icecream'
}, {
    image: 'assets/candies/3.png',
    symbol: 'donut'
}, {
    image: 'assets/candies/15.png',
    symbol: 'cupcake'
}, {
    image: 'assets/candies/16.png',
    symbol: 'star'
}, {
    image: 'assets/candies/17.png',
    symbol: 'candy'
}];
const UI_BACKGROUNDS = ['assets/ui/ui2.png', 'assets/ui/ui3.png', 'assets/ui/ui4.png', 'assets/ui/ui5.png', 'assets/ui/ui6.png', 'assets/ui/ui7.png'];
const MUSIC_TRACKS = ['assets/music/SA_Game_mode_mixed_modes_loop.mp3', 'assets/music/candy_crush_soundtrack3.mp3', 'assets/music/candy_crush_intro2.mp3', 'assets/music/candy_crush_soundtrack4.mp3', 'assets/music/candy_crush_loop5.mp3', 'assets/music/candy_crush_soundtrack2.mp3'];
let score = 0;
let level = 1;
let movesLeft = 15;
let targetScore = 100;
let selectedCandy = null;
let grid = [];
let isGameActive = true;
let powerups = {
    bomb: 1,
    shuffle: 1
};
let audioPlayer = null;
let isPlaying = false;
let currentTrackIndex = -1;

function initializeLevel() {
    score = 0;
    movesLeft = 10 + Math.floor(level / 2) * 2;
    targetScore = level * 250;
    let bombCount = 1;
    let shuffleCount = 1;
    if (level <= 6) {
        bombCount = 1 + Math.floor((level - 1) / 3);
        shuffleCount = 1 + Math.floor((level - 1) / 3);
    } else if (level <= 20) {
        bombCount = 2 + Math.floor((level - 7) / 3) * 2;
        shuffleCount = 2 + Math.floor((level - 7) / 3) * 2;
    } else {
        bombCount = 3 + Math.floor((level - 21) / 3) * 3;
        shuffleCount = 3 + Math.floor((level - 21) / 3) * 3;
    }
    powerups = {
        bomb: bombCount,
        shuffle: shuffleCount
    };
    document.getElementById('score').textContent = score;
    document.getElementById('target').textContent = targetScore;
    document.getElementById('moves').textContent = movesLeft;
    document.getElementById('level').textContent = level;
    document.getElementById('bomb').innerHTML = `<img src="assets/candies/19.png"> Bomb (${powerups.bomb})`;
    document.getElementById('shuffle').innerHTML = `<img src="assets/candies/18.png"> Shuffle (${powerups.shuffle})`;
    isGameActive = true;
}
function createGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    const obstacleCount = level === 1 ? 0 : level === 2 ? 2 : Math.min(Math.floor(level * 1.2), 15);
    const obstaclePositions = new Set();
    while (obstaclePositions.size < obstacleCount) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        let hasAdjacentObstacle = false;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (obstaclePositions.has(`${r},${c}`)) {
                    hasAdjacentObstacle = true;
                }
            }
        }
        if (!hasAdjacentObstacle) {
            obstaclePositions.add(`${row},${col}`);
        }
    }
    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            if (obstaclePositions.has(`${row},${col}`)) {
                const obstacle = document.createElement('div');
                obstacle.className = 'candy obstacle';
                const img = document.createElement('img');
                img.src = 'assets/candies/1.png';
                img.alt = 'obstacle';
                obstacle.appendChild(img);
                obstacle.dataset.row = row;
                obstacle.dataset.col = col;
                obstacle.dataset.type = 'obstacle';
                gridElement.appendChild(obstacle);
                grid[row][col] = obstacle;
            } else {
                const candy = createCandy(row, col);
                gridElement.appendChild(candy);
                grid[row][col] = candy;
            }
        }
    }
}
function usePowerup(type) {
    if (!isGameActive || powerups[type] <= 0) return;
    if (type === 'bomb') {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const affectedCandies = new Set();
        const radius = Math.min(1 + Math.floor(level / 3), 3);
        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                    if (grid[r][c].dataset.type !== 'obstacle') {
                        affectedCandies.add(grid[r][c]);
                    }
                }
            }
        }
        score += affectedCandies.size * (15 + level * 2);
        document.getElementById('score').textContent = score;
        removeMatches(affectedCandies);
    } else if (type === 'shuffle') {
        const candies = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col].dataset.type !== 'obstacle') {
                    candies.push(grid[row][col]);
                }
            }
        }
        for (let i = candies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            swapCandies(candies[i], candies[j]);
        }
    }
    powerups[type]--;
    const icon = type === 'bomb' ? '<img src="assets/candies/19.png">' : '<img src="assets/candies/18.png">';
    document.getElementById(type).innerHTML = `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)} (${powerups[type]})`;
    checkGameStatus();
    saveGameState();
}
function createCandy(row, col) {
    const candy = document.createElement('div');
    candy.className = 'candy';
    const randomType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
    candy.dataset.type = randomType.symbol;
    candy.dataset.row = row;
    candy.dataset.col = col;
    const randomUI = UI_BACKGROUNDS[Math.floor(Math.random() * UI_BACKGROUNDS.length)];
    candy.style.backgroundImage = `url(${randomUI})`;
    candy.style.backgroundSize = 'cover';
    const img = document.createElement('img');
    img.src = randomType.image;
    img.alt = randomType.symbol;
    candy.appendChild(img);
    candy.addEventListener('click', () => {
        if (isGameActive) handleCandyClick(candy);
    });
    return candy;
}
function handleCandyClick(candy) {
    if (!selectedCandy) {
        selectedCandy = candy;
        candy.classList.add('selected');
    } else {
        const row1 = parseInt(selectedCandy.dataset.row);
        const col1 = parseInt(selectedCandy.dataset.col);
        const row2 = parseInt(candy.dataset.row);
        const col2 = parseInt(candy.dataset.col);
        if (isAdjacent(row1, col1, row2, col2)) {
            swapCandies(selectedCandy, candy);
            if (!checkForMatches()) {
                swapCandies(selectedCandy, candy);
            } else {
                movesLeft--;
                document.getElementById('moves').textContent = movesLeft;
                checkGameStatus();
                saveGameState();
            }
        }
        selectedCandy.classList.remove('selected');
        selectedCandy = null;
    }
}
function checkGameStatus() {
    if (score >= targetScore) {
        showLevelComplete();
    } else if (movesLeft <= 0) {
        showGameOver();
    }
}
function showGameOver() {
    isGameActive = false;
    const gameOver = document.createElement('div');
    gameOver.className = 'game-over fail';
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.onclick = retryLevel;
    gameOver.appendChild(playButton);
    document.body.appendChild(gameOver);
}
function retryLevel() {
    const gameOver = document.querySelector('.game-over');
    if (gameOver) {
        gameOver.remove();
    }
    initializeLevel();
    createGrid();
}
function showLevelComplete() {
    isGameActive = false;
    const levelComplete = document.createElement('div');
    levelComplete.className = 'game-over complete';
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.onclick = nextLevel;
    levelComplete.appendChild(playButton);
    document.body.appendChild(levelComplete);
    score += movesLeft * 20;
    document.getElementById('score').textContent = score;
}
function nextLevel() {
    level++;
    const gameOver = document.querySelector('.game-over');
    if (gameOver) {
        gameOver.remove();
    }
    initializeLevel();
    createGrid();
}
function restartGame() {
    level = 1;
    localStorage.removeItem('candyCrushState');
    const gameOver = document.querySelector('.game-over');
    if (gameOver) {
        gameOver.remove();
    }
    initializeLevel();
    createGrid();
}
function isAdjacent(row1, col1, row2, col2) {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}
function swapCandies(candy1, candy2) {
    const tempType = candy1.dataset.type;
    const tempHtml = candy1.innerHTML;
    const tempBg = candy1.style.backgroundImage;
    candy1.dataset.type = candy2.dataset.type;
    candy1.innerHTML = candy2.innerHTML;
    candy1.style.backgroundImage = candy2.style.backgroundImage;
    candy2.dataset.type = tempType;
    candy2.innerHTML = tempHtml;
    candy2.style.backgroundImage = tempBg;
}
function checkForMatches() {
    let hasMatches = false;
    const matches = new Set();
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE - 2; col++) {
            if (grid[row][col].dataset.type !== 'obstacle' && grid[row][col].dataset.type === grid[row][col + 1].dataset.type && grid[row][col].dataset.type === grid[row][col + 2].dataset.type) {
                matches.add(grid[row][col]);
                matches.add(grid[row][col + 1]);
                matches.add(grid[row][col + 2]);
                hasMatches = true;
            }
        }
    }
    for (let row = 0; row < GRID_SIZE - 2; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col].dataset.type !== 'obstacle' && grid[row][col].dataset.type === grid[row + 1][col].dataset.type && grid[row][col].dataset.type === grid[row + 2][col].dataset.type) {
                matches.add(grid[row][col]);
                matches.add(grid[row + 1][col]);
                matches.add(grid[row + 2][col]);
                hasMatches = true;
            }
        }
    }
    if (hasMatches) {
        score += matches.size * 10;
        document.getElementById('score').textContent = score;
        matches.forEach(candy => {
            candy.classList.add('match-animation');
        });
        setTimeout(() => {
            matches.forEach(candy => {
                candy.classList.remove('match-animation');
            });
            removeMatches(matches);
        }, 300);
    }
    return hasMatches;
}
function removeMatches(matches) {
    matches.forEach(candy => {
        const row = parseInt(candy.dataset.row);
        const col = parseInt(candy.dataset.col);
        for (let r = row; r > 0; r--) {
            const type = grid[r - 1][col].dataset.type;
            const html = grid[r - 1][col].innerHTML;
            const bg = grid[r - 1][col].style.backgroundImage;
            grid[r][col].dataset.type = type;
            grid[r][col].innerHTML = html;
            grid[r][col].style.backgroundImage = bg;
        }
        const newCandy = createCandy(0, col);
        grid[0][col].dataset.type = newCandy.dataset.type;
        grid[0][col].innerHTML = newCandy.innerHTML;
        grid[0][col].style.backgroundImage = newCandy.style.backgroundImage;
        grid[0][col].classList.add('falling');
    });
    setTimeout(() => {
        document.querySelectorAll('.falling').forEach(candy => {
            candy.classList.remove('falling');
        });
        checkForMatches();
    }, 500);
}
function saveGameState() {
    const gameState = {
        score: score,
        level: level,
        movesLeft: movesLeft,
        targetScore: targetScore,
        powerups: powerups,
        grid: serializeGrid()
    };
    localStorage.setItem('candyCrushState', JSON.stringify(gameState));
}
function serializeGrid() {
    const serializedGrid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        serializedGrid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            serializedGrid[row][col] = {
                type: grid[row][col].dataset.type,
                backgroundImage: grid[row][col].style.backgroundImage
            };
        }
    }
    return serializedGrid;
}
function loadGameState() {
    const savedState = localStorage.getItem('candyCrushState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        score = gameState.score;
        level = gameState.level;
        movesLeft = gameState.movesLeft;
        targetScore = gameState.targetScore;
        powerups = gameState.powerups;
        document.getElementById('score').textContent = score;
        document.getElementById('target').textContent = targetScore;
        document.getElementById('moves').textContent = movesLeft;
        document.getElementById('level').textContent = level;
        document.getElementById('bomb').innerHTML = `<img src="assets/candies/19.png"> Bomb (${powerups.bomb})`;
        document.getElementById('shuffle').innerHTML = `<img src="assets/candies/18.png"> Shuffle (${powerups.shuffle})`;
        createGridFromSaved(gameState.grid);
    } else {
        initializeLevel();
        createGrid();
    }
}
function createGridFromSaved(savedGrid) {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const savedCell = savedGrid[row][col];
            if (savedCell.type === 'obstacle') {
                const obstacle = document.createElement('div');
                obstacle.className = 'candy obstacle';
                const img = document.createElement('img');
                img.src = 'assets/candies/1.png';
                img.alt = 'obstacle';
                obstacle.appendChild(img);
                obstacle.dataset.row = row;
                obstacle.dataset.col = col;
                obstacle.dataset.type = 'obstacle';
                gridElement.appendChild(obstacle);
                grid[row][col] = obstacle;
            } else {
                const candy = createCandy(row, col);
                candy.dataset.type = savedCell.type;
                candy.style.backgroundImage = savedCell.backgroundImage;
                const candyType = CANDY_TYPES.find(type => type.symbol === savedCell.type);
                candy.innerHTML = `<img src="${candyType.image}" alt="${candyType.symbol}">`;
                gridElement.appendChild(candy);
                grid[row][col] = candy;
            }
        }
    }
}
function startGame() {
  document.getElementById('titleScreen').style.display = 'none';
  document.querySelector('.game-container').style.display = 'block';
  loadGameState();
  startBackgroundMusic(); 
}

function startBackgroundMusic() {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    audioPlayer.addEventListener('ended', playNextTrack);
  }
  
  if (!isPlaying) {
    isPlaying = true;
    playNextTrack();
  }
}

function playNextTrack() {
  if (!isPlaying) return;

  try {
    if (audioPlayer.src) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    let nextIndex;
    if (currentTrackIndex === -1) {
      nextIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
    } else {
      const remainingTracks = MUSIC_TRACKS.filter((_, index) => index !== currentTrackIndex);
      nextIndex = MUSIC_TRACKS.indexOf(remainingTracks[Math.floor(Math.random() * remainingTracks.length)]);
    }

    currentTrackIndex = nextIndex;
    audioPlayer.src = MUSIC_TRACKS[currentTrackIndex];
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Playback failed:", error);
        setTimeout(() => {
          if (isPlaying) {
            audioPlayer.play().catch(() => {});
          }
        }, 1000);
      });
    }
  } catch (error) {
    console.log("Error during playback:", error);
  }
}

function stopBackgroundMusic() {
  isPlaying = false;
  if (audioPlayer) {
    try {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    } catch (error) {
      console.log("Error stopping playback:", error);
    }
  }
  currentTrackIndex = -1;
}
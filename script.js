const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(30, 30);

const moveSound = document.getElementById('moveSound');
const dropSound = document.getElementById('dropSound');
const lineClearSound = document.getElementById('lineClearSound');

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;

const colors = [
    null,
    'red',
    'blue',
    'green',
    'purple',
    'orange',
    'yellow',
    'cyan'
];

const arena = createMatrix(12, 18); // Уменьшили высоту арены

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

let nextPiece = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);

function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += 10;
        playSound(lineClearSound);
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') {
        return [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0],
        ];
    } else if (type === 'L') {
        return [
            [0,0,0],
            [2,2,2],
            [2,0,0],
        ];
    } else if (type === 'J') {
        return [
            [0,0,0],
            [3,3,3],
            [0,0,3],
        ];
    } else if (type === 'O') {
        return [
            [4,4],
            [4,4],
        ];
    } else if (type === 'Z') {
        return [
            [0,0,0],
            [5,5,0],
            [0,5,5],
        ];
    } else if (type === 'S') {
        return [
            [0,0,0],
            [0,6,6],
            [6,6,0],
        ];
    } else if (type === 'T') {
        return [
            [0,0,0],
            [7,7,7],
            [0,7,0],
        ];
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(nextPiece, {x: 1, y: 1}, nextContext);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playSound(dropSound);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        playSound(moveSound);
    }
}

function playerReset() {
    player.matrix = nextPiece;
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    nextPiece = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);
    drawNext();
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function update(time = 0) {
    if (isPaused) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    dropInterval = 1000 - player.score * 10;
    if (dropInterval < 100) {
        dropInterval = 100;
    }
}

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    } else if (event.keyCode === 80) { // 'P' key for pause
        isPaused = !isPaused;
        if (!isPaused) {
            update();
        }
    }
});

playerReset();
updateScore();
drawNext();
requestAnimationFrame(update);

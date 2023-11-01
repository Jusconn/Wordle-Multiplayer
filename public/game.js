const socket = io();
let dictionary = [];
let message = "";
let oppName ="";
let oppWord = "";
let playerName = "";
let secretWord = "";
let roomCode = "";
let act = "";

socket.on('connect',async() =>{
    console.log("connected");
    dictionary = await loadDictionary();
    await params();
    createORjoin();
    

    const playersContainer = document.getElementById("players-container");
    if (playersContainer && playerName) {
        // Find the element with the id name1 inside playersContainer and set its text content
        const name1Element = playersContainer.querySelector("#name1");
        if (name1Element) {
            name1Element.textContent = playerName;
        }
    }
    document.getElementById("roomCode").textContent = `Room Code: ${roomCode}`;

    socket.on('gameStart', () => {
        console.log('playgame');
        // Allow users to input their name and secret word
        startup();
    });

    socket.on('opponentTurn', (data) => {
        const opponentTurn = data;
        message =`${oppName} is on guess: ${data}`;
        document.getElementById("message").textContent = message;

    });

    socket.on('opponentWin', (data) => {
       const oppWin = data
        message = `${oppName} guessed right in ${oppWin} tries!`;
        document.getElementById("message").textContent = message;

    });
    socket.on('data', (data) => {
        console.log('recieved opp data');
        console.log(data.name);
        oppName = data.name;
        console.log(oppName);
        state.secret = data.word;
        console.log(data.word);

        message =`${oppName} is on guess: 1`;
        document.getElementById("message").textContent = message;
        const playersContainer = document.getElementById("players-container");
        if (playersContainer && playerName) {
            // Find the element with the id name1 inside playersContainer and set its text content
            const name2Element = playersContainer.querySelector("#name2");
            if (name2Element) {
                name2Element.textContent = oppName;
            }}

    });
})
async function params() {
    const urlstring = window.location.href;
    const urlParams = new URLSearchParams(urlstring);
    console.log(urlParams);
    console.log('URL Parameters - before:', urlParams.get('pname'));
    playerName = urlParams.get('http://localhost:3000/game.html?pname');
    act = urlParams.get('act');
    console.log(playerName);
    roomCode = urlParams.get('roomCode');
    console.log(act);
    secretWord = urlParams.get('word');
    

}


async function loadDictionary() {
    try {
        const response = await fetch('dictionary.json');
        const data = await response.json();
        return data.words;
    } catch (error) {
        console.error('Error loading dictionary:', error);
        return [];
    }
}


let state = {
    secret: "",
    grid: Array(6)
        .fill()
        .map(() => Array(5).fill('')),
        currentRow: 0,
        currentCol: 0,
}

function updateGrid(){
    for(let i = 0; i<state.grid.length;i++){
        for(let j = 0; j<state.grid[i].length;j++){
            const box = document.getElementById(`box${i}${j}`);
            box.textContent = state.grid[i][j];
        }
    }
}
function drawBox(container,row,col,letter = ''){
    const box = document.createElement('div');
    box.className = 'box';
    box.id = `box${row}${col}`;
    box.textContent = letter;
    
    container.appendChild(box);
    return box;

}
function registerKeyboardEvents(){
    document.body.onkeydown = (e) => {
        const key = e.key;
        if (key == 'Enter'){
            if(state.currentCol === 5){
                const word = getCurrentWord();
                if(isWordValid(word)){
                    revealWord(word);
                    state.currentRow++;
                    state.currentCol = 0;
                    socket.emit('turn',{roomCode:roomCode,guess:state.currentRow});
                }
                else{
                    alert('Not a valid word.');
                }
            }

        }
        if (key == 'Backspace'){
            removeLetter();
            
        }
        if (isLetter(key)){
            addLetter(key);
            
        }
        updateGrid();
    };
}

function drawGrid(container){
    const grid = document.createElement('div');
    grid.className = 'grid';

    for(let i = 0; i<6; i++){
        for(let j = 0; j<5; j++){
            drawBox(grid,i,j);
        }
    }
    
    container.appendChild(grid);
}

function getCurrentWord(){
    return state.grid[state.currentRow].reduce((prev,curr) => prev + curr);
}

function isWordValid(word){
    return dictionary.includes(word);

}

function revealWord(guess){
    const row = state.currentRow;
    const animation_duration = 500;
    
    for(let i = 0; i<5; i++){
        const box = document.getElementById(`box${row}${i}`);
        const letter = box.textContent;

    setTimeout(() =>  {if(letter === state.secret[i]){
        box.classList.add('right');
    } else if(state.secret.includes(letter)){
        box.classList.add('wrong');
    } else{
        box.classList.add('empty');
    }
    }, ((i + 1)* animation_duration)/2);
    
    
        box.classList.add('animated');
        box.style.animationDelay = `${(i * animation_duration)/2}ms`;
    }

    const isWinner = state.secret === guess;
    const isGameOver = state.currentRow === 5;
    setTimeout(() => {
        if(isWinner){
            socket.emit('win',{roomCode:roomCode, guess:state.currentRow});
            alert('You Won!');
        } else if(isGameOver){
            alert(`Game Over! The word was ${state.secret}.`);
        }

    }, 3* animation_duration);
}

function isLetter(key){
    return key.length === 1 && key.match(/[a-z]/i);
}

function addLetter(letter){
    if(state.currentCol === 5) return;
    state.grid[state.currentRow][state.currentCol] = letter;
    state.currentCol++;
}

function removeLetter(){
    if(state.currentCol === 0) return;
    state.grid[state.currentRow][state.currentCol - 1] = '';
    state.currentCol--;
}
function createORjoin(){
    if(act === "create"){
        socket.emit('createRoom',roomCode);
    }
    else if (act === "join"){
        socket.emit('joinRoom',roomCode);
    }
}
function startup(){
    socket.emit('data',{pname:playerName, secret:secretWord, roomCode:roomCode});
        const game = document.getElementById('game');
        drawGrid(game);
        registerKeyboardEvents();
    };

//left off on startinput function

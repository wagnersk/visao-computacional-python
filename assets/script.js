let video, canvas, ctx, ws;
let quality = 0.5;
let drawDebugLandmarks = false;

// Mode State
let currentMode = 'ninja'; // 'ninja' or 'gestures'

// Gesture State
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];
// Game State
let gameState = 'PLAYING'; // 'PLAYING', 'GAMEOVER'
let score = 0;
let lives = 3;
let fruits = [];
let bombs = [];
let bladeTrail = [];
const TRAIL_LENGTH = 10;
let lastTime = 0;

// Configurações do Jogo
const FRUIT_COLORS = ['#ff3366', '#ffb703', '#8338ec', '#00dfd8'];
const SPAWN_RATE = 1500; // ms
let lastSpawn = 0;

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const landmarksCb = document.getElementById('draw-landmarks-cb');
    const fpsCounter = document.getElementById('fps-counter');
    const gestureContainer = document.getElementById('gesture-container');
    
    // UI Elements Tabs & HUDs
    const tabNinja = document.getElementById('tab-ninja');
    const tabGestures = document.getElementById('tab-gestures');
    const hudNinja = document.getElementById('hud-ninja');
    const hudGestures = document.getElementById('hud-gestures');

    const gestureImage = document.getElementById('gesture-image');
    const matchStatus = document.getElementById('match-status');

    // UI Elements Game
    const elScore = document.getElementById('game-score');
    const elLives = document.getElementById('game-lives');
    const overScreen = document.getElementById('game-over-screen');
    const finalScore = document.getElementById('final-score');
    const btnRestart = document.getElementById('btn-restart');
    
    // Switch Tabs Logic
    tabNinja.onclick = () => {
        currentMode = 'ninja';
        tabNinja.classList.add('active');
        tabGestures.classList.remove('active');
        hudNinja.classList.remove('hidden');
        hudGestures.classList.add('hidden');
        updateHUD(); // updates game over screen visibility if needed
    };

    tabGestures.onclick = () => {
        currentMode = 'gestures';
        tabGestures.classList.add('active');
        tabNinja.classList.remove('active');
        hudGestures.classList.remove('hidden');
        hudNinja.classList.add('hidden');
        overScreen.classList.add('hidden'); // Hide game over overlay in gesture mode
    };

    let reconnectDelay = 1000;
    let reconnectTimeout = null;

    qualitySlider.oninput = (e) => {
        quality = parseFloat(e.target.value);
        qualityValue.innerText = Math.round(quality * 100) + "%";
    };

    landmarksCb.onchange = (e) => {
        drawDebugLandmarks = e.target.checked;
    };

    btnRestart.onclick = () => {
        score = 0;
        lives = 3;
        fruits = [];
        bombs = [];
        bladeTrail = [];
        gameState = 'PLAYING';
        overScreen.classList.add('hidden');
        updateHUD();
    };

    function updateHUD() {
        elScore.innerText = `SCORE: ${score}`;
        elLives.innerText = `LIVES: ${'🍉'.repeat(lives)}`;
        if (lives <= 0 && gameState !== 'GAMEOVER') {
            gameState = 'GAMEOVER';
            finalScore.innerText = score;
            overScreen.classList.remove('hidden');
        }
    }

    // --- GAME ENGINE LOGIC ---
    function spawnFruitOrBomb() {
        if (gameState !== 'PLAYING') return;
        
        const isBomb = Math.random() < 0.2; // 20% chance de bomba
        const xPos = Math.random() * (canvas.width - 100) + 50;
        
        const entity = {
            id: Math.random(),
            x: xPos,
            y: canvas.height + 50,
            vx: (Math.random() - 0.5) * 6, // Inércia lateral
            vy: -(Math.random() * 8 + 15), // Pulo inicial forte
            radius: isBomb ? 25 : 30,
            color: isBomb ? '#111' : FRUIT_COLORS[Math.floor(Math.random() * FRUIT_COLORS.length)],
            isBomb: isBomb,
            active: true
        };
        
        if (isBomb) {
            bombs.push(entity);
        } else {
            fruits.push(entity);
        }
    }

    function checkCollisions() {
        if (bladeTrail.length < 2 || gameState !== 'PLAYING') return;

        // Pega a posição mais recente do dedo (ponta da espada)
        const tip = bladeTrail[bladeTrail.length - 1];

        // Cortar Frutas
        fruits.forEach(f => {
            if (!f.active) return;
            const dist = Math.hypot(tip.x - f.x, tip.y - f.y);
            if (dist < f.radius + 15) { // + margem da espada
                f.active = false;
                score += 10;
                updateHUD();
                // Efeitos visuais poderiam ser adicionados aqui
            }
        });

        // Tocar em Bombas
        bombs.forEach(b => {
             if (!b.active) return;
             const dist = Math.hypot(tip.x - b.x, tip.y - b.y);
             if (dist < b.radius + 15) {
                 b.active = false;
                 lives--;
                 updateHUD();
                 
                 // Efeito visual de tremor rápido
                 canvas.style.transform = `translateX(${Math.random() * 20 - 10}px)`;
                 setTimeout(() => canvas.style.transform = 'none', 100);
             }
        });
    }

    function updatePhysics(dt) {
        if (gameState !== 'PLAYING') return;

        const gravity = 0.4;

        // Atualiza Frutas
        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vy += gravity;

            // Remove se saiu bem pela parte de baixo sem ser cortada (perde vida)
            if (f.y > canvas.height + 100) {
                if (f.active) { 
                    lives--;
                    updateHUD();
                }
                fruits.splice(i, 1);
            }
        }

        // Atualiza Bombas
        for (let i = bombs.length - 1; i >= 0; i--) {
            let b = bombs[i];
            b.x += b.vx;
            b.y += b.vy;
            b.vy += gravity;

            // Remove se caiu pela tela
            if (b.y > canvas.height + 100) {
                bombs.splice(i, 1);
            }
        }
    }

    function renderGameEngine() {
        const now = Date.now();
        const dt = now - lastTime;
        
        if (now - lastSpawn > SPAWN_RATE && gameState === 'PLAYING') {
            spawnFruitOrBomb();
            lastSpawn = now;
        }

        updatePhysics(dt);
        checkCollisions();
        
        lastTime = now;

        // Desenhar Frutas ativas e fatiadas
        fruits.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, 2 * Math.PI);
            ctx.fillStyle = f.active ? f.color : 'rgba(255, 255, 255, 0.2)'; // Fica transparente se cortou
            ctx.fill();
            if (f.active) {
                // Brilho pra ficar bonito
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
        });

        // Desenhar Bombas
        bombs.forEach(b => {
            if (!b.active) return;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#222';
            ctx.fill();
            // Fio vermelho da bomba
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - b.radius);
            ctx.lineTo(b.x + 10, b.y - b.radius - 15);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ff4d4d';
            ctx.stroke();
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('💣', b.x - 12, b.y + 8);
        });

        // Desenhar Rastro da Espada (Dedo Indicador)
        if (bladeTrail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
            for (let i = 1; i < bladeTrail.length; i++) {
                ctx.lineTo(bladeTrail[i].x, bladeTrail[i].y);
            }
            ctx.lineWidth = 12;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = 'rgba(0, 223, 216, 0.8)'; // Ciano Trail
            ctx.shadowColor = '#00dfd8';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }
    }
    // --- END GAME ENGINE ---

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = stream;
            await video.play();
            lastTime = Date.now();
            connectWS();
        } catch (err) {
            console.error("Camera error:", err);
            alert("Erro ao acessar câmera: " + err.message);
        }
    }

    function connectWS() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        
        ws.onopen = () => {
            console.log("Connected to AI Server");
            reconnectDelay = 1000;
            sendFrame();
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            fpsCounter.innerText = `FPS: ${data.fps}`;

            // ---- Gesture Mode UI Updates ----
            if (currentMode === 'gestures') {
                if (data.labels && data.labels.length > 0) {
                    gestureContainer.innerHTML = data.labels.map(l => `
                        <div class="gesture-item" style="color:var(--text); background:rgba(255,255,255,0.05);">
                            <span class="hand-label">${l.hand}</span>
                            <span class="gesture-name">${l.gesture}</span>
                            <span class="confidence">${Math.round(l.confidence * 100)}%</span>
                        </div>
                    `).join('');
                } else {
                    gestureContainer.innerHTML = "<div style='opacity:0.5; text-align:center'>Detecting hands...</div>";
                }

                if (data.matched_gesture_image && data.matched_gesture_image !== "") {
                    gestureImage.src = `/assets/images/gestures/${data.matched_gesture_image}`;
                    gestureImage.style.opacity = '1';
                    matchStatus.innerText = "PERFECT MATCH!";
                    matchStatus.style.color = 'var(--secondary)';
                } else {
                    gestureImage.style.opacity = '0';
                    matchStatus.innerText = "Waiting for match...";
                    matchStatus.style.color = 'var(--text-dim)';
                }
            } else {
                gestureContainer.innerHTML = "<div style='opacity:0.5; text-align:center'>Game Engine Mode</div>";
            }

            if (data.image) {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Desenha Fundo da Câmera Espelhada
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, -canvas.width, 0, canvas.width, canvas.height);
                    ctx.restore();

                    if (currentMode === 'ninja') {
                        // Rastreamento para Escurecer a tela e dar Foco no Jogo
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        let fingerDetected = false;
                        if (data.labels && data.labels.length > 0) {
                            const hand = data.labels[0]; // Interage com a primeira mão encontrada
                            if (hand.landmarks && hand.landmarks.length > 8) {
                                fingerDetected = true;
                                const screenX = (1 - hand.landmarks[8].x) * canvas.width;
                                const screenY = hand.landmarks[8].y * canvas.height;
                                
                                bladeTrail.push({x: screenX, y: screenY});
                                if (bladeTrail.length > TRAIL_LENGTH) {
                                    bladeTrail.shift();
                                }
                            }
                        }

                        // Debug Vision Mode Ninja
                        if (drawDebugLandmarks && data.labels) {
                            ctx.fillStyle = '#ff3366';
                            data.labels.forEach(h => {
                                h.landmarks.forEach(lm => {
                                    ctx.beginPath();
                                    ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 4, 0, Math.PI*2);
                                    ctx.fill();
                                });
                            });
                        }

                        // Encolhe a espada se tirar a mão
                        if (!fingerDetected && bladeTrail.length > 0) {
                            bladeTrail.shift();
                        }

                        // Roda a camada de Física e Renderização do Jogo Game
                        renderGameEngine();
                    } else if (currentMode === 'gestures') {
                        // Desenha o esqueleto das mãos do gesture mode original
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        if (data.labels) {
                            data.labels.forEach((hand) => {
                                if (hand.landmarks) {
                                    ctx.strokeStyle = '#00dfd8';
                                    ctx.lineWidth = 4;
                                    HAND_CONNECTIONS.forEach(([i, j]) => {
                                        const p1 = hand.landmarks[i];
                                        const p2 = hand.landmarks[j];
                                        if (p1 && p2) {
                                            ctx.beginPath();
                                            // Lembre-se que o canvas está espelhado visualmente, mas nós desenhamos na coordenada invertida 1 - X
                                            ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
                                            ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
                                            ctx.stroke();
                                        }
                                    });

                                    ctx.fillStyle = '#ff3366';
                                    hand.landmarks.forEach(lm => {
                                        ctx.beginPath();
                                        ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                                        ctx.fill();
                                    });
                                }
                            });
                        }
                    }

                    // Loop Request
                    requestAnimationFrame(sendFrame);
                };
                img.src = 'data:image/jpeg;base64,' + data.image;
            } else {
                requestAnimationFrame(sendFrame);
            }
        };

        ws.onclose = () => {
            console.warn(`WebSocket disconnected. Reconnecting in ${reconnectDelay / 1000}s...`);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectWS, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 1.5, 10000); 
        };
        
        ws.onerror = (err) => {
            console.error("WebSocket encountered error: ", err, "Closing socket");
            ws.close();
        };
    }

    function sendFrame() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const sendCanvas = document.createElement('canvas');
        sendCanvas.width = video.videoWidth;
        sendCanvas.height = video.videoHeight;
        const sCtx = sendCanvas.getContext('2d');
        sCtx.drawImage(video, 0, 0);
        const base64Img = sendCanvas.toDataURL('image/jpeg', quality).split(',')[1];
        ws.send(JSON.stringify({ image: base64Img, draw_landmarks: false })); // Não pedir linhas desenhadas pelo Python
    }

    // Init
    updateHUD();
    startCamera();
});


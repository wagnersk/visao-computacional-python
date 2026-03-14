let video, canvas, ctx, ws;
let quality = 0.6;
let drawLandmarks = true;

// Move constant outside of message loop for memory optimization
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const landmarksCb = document.getElementById('draw-landmarks-cb');
    const fpsCounter = document.getElementById('fps-counter');
    const gestureContainer = document.getElementById('gesture-container');
    const gestureImage = document.getElementById('gesture-image');
    const matchStatus = document.getElementById('match-status');
    const matchCard = document.getElementById('match-card');

    let reconnectDelay = 1000; // Configured for Exponential Backoff
    let reconnectTimeout = null;

    qualitySlider.oninput = (e) => {
        quality = parseFloat(e.target.value);
        qualityValue.innerText = Math.round(quality * 100) + "%";
    };

    landmarksCb.onchange = (e) => {
        drawLandmarks = e.target.checked;
    };

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = stream;
            await video.play();
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
            reconnectDelay = 1000; // Reset delay on successful connection
            sendFrame();
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            fpsCounter.innerText = `FPS: ${data.fps}`;
            
            if (data.labels && data.labels.length > 0) {
                gestureContainer.innerHTML = data.labels.map(l => `
                    <div class="gesture-item">
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
                matchCard.classList.add('match-active');
            } else {
                gestureImage.style.opacity = '0';
                matchStatus.innerText = "Waiting for match...";
                matchCard.classList.remove('match-active');
            }

            if (data.image) {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    if (drawLandmarks && data.labels) {
                        data.labels.forEach((hand) => {
                            if (hand.landmarks) {
                                ctx.strokeStyle = '#0070f3';
                                ctx.lineWidth = 4;
                                HAND_CONNECTIONS.forEach(([i, j]) => {
                                    const p1 = hand.landmarks[i];
                                    const p2 = hand.landmarks[j];
                                    if (p1 && p2) {
                                        ctx.beginPath();
                                        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                                        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                                        ctx.stroke();
                                    }
                                });

                                ctx.fillStyle = '#00dfd8';
                                hand.landmarks.forEach(lm => {
                                    ctx.beginPath();
                                    ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                                    ctx.fill();
                                });
                            }
                        });
                    }
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
            // Exponential backoff, limit to 10 seconds empty waiting
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
        ws.send(JSON.stringify({ image: base64Img, draw_landmarks: drawLandmarks }));
    }

    startCamera();
});


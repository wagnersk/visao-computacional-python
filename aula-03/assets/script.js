let video, canvas, ctx, ws;
let quality = 0.6;
let showLandmarks = true;

const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],[0,17]
];

// Cores em ciclo RGB/arco-íris por índice do landmark (0–20)
function landmarkColor(index, alpha = 1) {
    const hue = (index / 21) * 360;
    return `hsla(${hue}, 85%, 60%, ${alpha})`;
}

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    const fps = document.getElementById('fps-counter');
    const gestures = document.getElementById('gesture-container');
    const matchImg = document.getElementById('gesture-image');
    const matchLabel = document.getElementById('match-status');
    const matchOverlay = document.getElementById('match-overlay');
    const qSlider = document.getElementById('quality-slider');
    const qValue = document.getElementById('quality-value');
    const lmCb = document.getElementById('draw-landmarks-cb');

    let reconnectDelay = 1000;

    qSlider.oninput = e => {
        quality = parseFloat(e.target.value);
        qValue.textContent = Math.round(quality * 100) + '%';
    };
    lmCb.onchange = e => { showLandmarks = e.target.checked; };

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = stream;
            await video.play();
            connect();
        } catch (err) {
            alert("Erro ao acessar câmera: " + err.message);
        }
    }

    function connect() {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${location.host}/ws`);

        ws.onopen = () => { reconnectDelay = 1000; send(); };

        ws.onmessage = e => {
            const d = JSON.parse(e.data);
            fps.textContent = d.fps + ' fps';

            // Gesture badges
            if (d.labels && d.labels.length) {
                gestures.innerHTML = d.labels.map(l =>
                    `<div class="badge">
                        <span class="badge-hand">${l.hand === 'Left' ? 'E' : 'D'}</span>
                        <span class="badge-name">${l.gesture}</span>
                        <span class="badge-conf">${Math.round(l.confidence * 100)}%</span>
                    </div>`
                ).join('');
            } else {
                gestures.innerHTML = '';
            }

            // Match overlay
            if (d.matched_gesture_image) {
                matchImg.src = `/assets/images/gestures/${d.matched_gesture_image}`;
                matchOverlay.classList.add('active');
                matchLabel.textContent = 'Perfect Match!';
            } else {
                matchOverlay.classList.remove('active');
                matchLabel.textContent = 'Aguardando match...';
            }

            if (!d.image) { requestAnimationFrame(send); return; }

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(img, -canvas.width, 0, canvas.width, canvas.height);
                ctx.restore();

                if (showLandmarks && d.labels) {
                    d.labels.forEach(h => {
                        if (!h.landmarks) return;
                        const lm = h.landmarks;
                        const w = canvas.width, ht = canvas.height;

                        ctx.lineWidth = 2.5;
                        CONNECTIONS.forEach(([a, b], connIdx) => {
                            if (!lm[a] || !lm[b]) return;
                            ctx.strokeStyle = landmarkColor((a + b) / 2, 0.85);
                            ctx.beginPath();
                            ctx.moveTo((1 - lm[a].x) * w, lm[a].y * ht);
                            ctx.lineTo((1 - lm[b].x) * w, lm[b].y * ht);
                            ctx.stroke();
                        });

                        lm.forEach((p, i) => {
                            ctx.fillStyle = landmarkColor(i);
                            ctx.beginPath();
                            ctx.arc((1 - p.x) * w, p.y * ht, 4, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        });
                    });
                }

                requestAnimationFrame(send);
            };
            img.src = 'data:image/jpeg;base64,' + d.image;
        };

        ws.onclose = () => {
            setTimeout(connect, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
        };
        ws.onerror = () => ws.close();
    }

    function send() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d').drawImage(video, 0, 0);
        ws.send(JSON.stringify({
            image: c.toDataURL('image/jpeg', quality).split(',')[1],
            draw_landmarks: showLandmarks
        }));
    }

    startCamera();
});

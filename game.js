// 1. Scene, Camera, Renderer Setup
const canvas = document.getElementById('webglCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const width = canvas.clientWidth || 600;
const height = canvas.clientHeight || 380;

const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(width, height, false);

window.addEventListener('resize', () => {
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 380;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Web Audio API Sound & Explosion Synthesizer
let audioCtx = null;
function playCrashSound(isExplosion = false) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const duration = isExplosion ? 1.2 : 0.15;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
       
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isExplosion ? 200 : 400, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(isExplosion ? 1.0 : 0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start();
    } catch (e) {}
}

// 2. Build Arena
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);
const arenaRadius = 20;

const floorGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 0.2, 32);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.y = -0.1;
arenaGroup.add(floorMesh);

const wallGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 3.0, 32, 1, true);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, side: THREE.DoubleSide });
const wallMesh = new THREE.Mesh(wallGeo, wallMat);
wallMesh.position.y = 1.4;
arenaGroup.add(wallMesh);

// Vehicle Type Configurations
const vehicleTypes = {
    yukon: {
        name: "GMC Yukon",
        maxSpeed: 0.35,
        acceleration: 0.01,
        turnSpeed: 0.04,
        damageMultiplier: 1.0,
        buildMesh: (primaryColor) => {
            const group = new THREE.Group();
            const bodyGeo = new THREE.BoxGeometry(2.2, 1.3, 4.4);
            const bodyMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.4, metalness: 0.3 });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.y = 1.05;
            group.add(bodyMesh);

            const cabinGeo = new THREE.BoxGeometry(2.0, 1.0, 2.4);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.2 });
            const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
            cabinMesh.position.set(0, 1.95, -0.2);
            group.add(cabinMesh);

            const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16);
            wheelGeo.rotateZ(Math.PI / 2);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            [[-1.2, 0.45, 1.4], [1.2, 0.45, 1.4], [-1.2, 0.45, -1.4], [1.2, 0.45, -1.4]].forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(...pos);
                group.add(wheel);
            });
            scene.add(group);
            return { group, bodyMat, cabinMat };
        }
    },
    camry: {
        name: "Toyota Camry",
        maxSpeed: 0.42,
        acceleration: 0.013,
        turnSpeed: 0.05,
        damageMultiplier: 1.4,
        buildMesh: (primaryColor) => {
            const group = new THREE.Group();
            const bodyGeo = new THREE.BoxGeometry(1.9, 0.9, 4.2);
            const bodyMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.3, metalness: 0.4 });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.y = 0.85;
            group.add(bodyMesh);

            const cabinGeo = new THREE.BoxGeometry(1.7, 0.8, 2.0);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
            const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
            cabinMesh.position.set(0, 1.55, -0.1);
            group.add(cabinMesh);

            const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.4, 16);
            wheelGeo.rotateZ(Math.PI / 2);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            [[-1.0, 0.38, 1.3], [1.0, 0.38, 1.3], [-1.0, 0.38, -1.3], [1.0, 0.38, -1.3]].forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(...pos);
                group.add(wheel);
            });
            scene.add(group);
            return { group, bodyMat, cabinMat };
        }
    },
    ram: {
        name: "Dodge Ram",
        maxSpeed: 0.31,
        acceleration: 0.009,
        turnSpeed: 0.035,
        damageMultiplier: 0.65,
        buildMesh: (primaryColor) => {
            const group = new THREE.Group();
            const bodyGeo = new THREE.BoxGeometry(2.3, 1.4, 4.6);
            const bodyMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.5, metalness: 0.2 });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.y = 1.1;
            group.add(bodyMesh);

            const cabinGeo = new THREE.BoxGeometry(2.1, 1.1, 2.2);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
            const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
            cabinMesh.position.set(0, 2.0, 0.3);
            group.add(cabinMesh);

            const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.55, 16);
            wheelGeo.rotateZ(Math.PI / 2);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            [[-1.3, 0.52, 1.5], [1.3, 0.52, 1.5], [-1.3, 0.52, -1.5], [1.3, 0.52, -1.5]].forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(...pos);
                group.add(wheel);
            });
            scene.add(group);
            return { group, bodyMat, cabinMat };
        }
    }
};

let playerVehicleType = 'yukon';
let aiVehicleType = 'camry';

let playerCar = null;
let aiCar = null;

const playerHealth = { engine: 100, body: 100, fl: 100, fr: 100, rl: 100, rr: 100 };
const aiHealth = { engine: 100, body: 100, fl: 100, fr: 100, rl: 100, rr: 100 };

let gameStarted = false;
let countdownActive = false;
let isGameOver = false;

const playerState = {
    x: -6, z: 0, y: 5.0, velocityY: 0, angle: 0, speed: 0,
    maxSpeed: 0.35, acceleration: 0.01, friction: 0.96, turnSpeed: 0.04, damageMultiplier: 1.0
};

const aiState = {
    x: 6, z: 0, y: 5.0, velocityY: 0, angle: Math.PI, speed: 0,
    maxSpeed: 0.33, acceleration: 0.01, friction: 0.96, turnSpeed: 0.04, damageMultiplier: 1.0
};

function initMatch(pType) {
    playerVehicleType = pType;

    const keysArr = Object.keys(vehicleTypes);
    const availableAI = keysArr.filter(k => k !== playerVehicleType);
    aiVehicleType = availableAI[Math.floor(Math.random() * availableAI.length)] || playerVehicleType;

    // Update the live matchup text banner at top left
    const pName = vehicleTypes[playerVehicleType].name;
    const aiName = vehicleTypes[aiVehicleType].name;
    document.getElementById('playerMatchupText').innerText = `YOU: ${pName}`;
    document.getElementById('aiMatchupText').innerText = `AI: ${aiName}`;

    if (playerCar) scene.remove(playerCar.group);
    if (aiCar) scene.remove(aiCar.group);

    playerCar = vehicleTypes[playerVehicleType].buildMesh(playerVehicleType === 'yukon' ? 0x4a525a : (playerVehicleType === 'camry' ? 0x2980b9 : 0x27ae60));
    aiCar = vehicleTypes[aiVehicleType].buildMesh(0x8b0000);

    const pConf = vehicleTypes[playerVehicleType];
    playerState.maxSpeed = pConf.maxSpeed;
    playerState.acceleration = pConf.acceleration;
    playerState.turnSpeed = pConf.turnSpeed;
    playerState.damageMultiplier = pConf.damageMultiplier;

    const aiConf = vehicleTypes[aiVehicleType];
    aiState.maxSpeed = aiConf.maxSpeed;
    aiState.acceleration = aiConf.acceleration;
    aiState.turnSpeed = aiConf.turnSpeed;
    aiState.damageMultiplier = aiConf.damageMultiplier;

    for (let part in playerHealth) playerHealth[part] = 100;
    for (let part in aiHealth) aiHealth[part] = 100;
    updateHealthUI();

    playerState.x = -6; playerState.z = 0; playerState.y = 5.0; playerState.velocityY = 0; playerState.angle = 0; playerState.speed = 0;
    aiState.x = 6; aiState.z = 0; aiState.y = 5.0; aiState.velocityY = 0; aiState.angle = Math.PI; aiState.speed = 0;
}

function updateHealthUI() {
    for (let part in playerHealth) {
        let hp = Math.max(0, playerHealth[part]);
        const elem = document.getElementById(`hud-${part}`);
        if (!elem) continue;

        if (hp > 65) {
            elem.style.backgroundColor = '#ffffff';
            elem.style.color = '#000';
        } else if (hp > 55) {
            elem.style.backgroundColor = '#f1c40f';
            elem.style.color = '#000';
        } else if (hp > 45) {
            elem.style.backgroundColor = '#e67e22';
            elem.style.color = '#fff';
        } else if (hp > 12) {
            elem.style.backgroundColor = '#e74c3c';
            elem.style.color = '#fff';
        } else {
            elem.style.backgroundColor = '#111111';
            elem.style.color = '#444';
        }
    }
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

const wheelContainer = document.getElementById('wheelContainer');
const wheelKnob = document.getElementById('wheelKnob');
let joystickInput = { x: 0, y: 0, active: false };

function handleTouchMove(clientX, clientY) {
    const rect = wheelContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
   
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxDist = 35;

    if (distance > maxDist) {
        dx = (dx / distance) * maxDist;
        dy = (dy / distance) * maxDist;
    }

    wheelKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickInput.x = dx / maxDist;
    joystickInput.y = dy / maxDist;
    joystickInput.active = true;
}

function resetJoystick() {
    wheelKnob.style.transform = `translate(0px, 0px)`;
    joystickInput.x = 0;
    joystickInput.y = 0;
    joystickInput.active = false;
}

wheelContainer.addEventListener('pointerdown', e => {
    e.preventDefault();
    handleTouchMove(e.clientX, e.clientY);
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
});
window.addEventListener('pointermove', e => { if (joystickInput.active) handleTouchMove(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => resetJoystick());// Start Button & Countdown Sequence
const startBtn = document.getElementById('startButton');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
       
        const vehicleSelectElem = document.getElementById('vehicleSelect');
        const selectedVeh = vehicleSelectElem ? vehicleSelectElem.value : 'yukon';
        initMatch(selectedVeh);

        document.getElementById('startScreen').style.display = 'none';
       
        window.dispatchEvent(new Event('resize'));

        const cdScreen = document.getElementById('countdownScreen');
        cdScreen.style.display = 'block';
        countdownActive = true;

        let count = 5;
        cdScreen.innerText = count;

        let cdInterval = setInterval(() => {
            count--;
            if (count > 0) {
                cdScreen.innerText = count;
            } else if (count === 0) {
                cdScreen.innerText = "GO!";
            } else {
                clearInterval(cdInterval);
                cdScreen.style.display = 'none';
                countdownActive = false;
                gameStarted = true;
            }
        }, 1000);
    });
}

// Home Screen Reset Function
document.getElementById('homeButton').addEventListener('click', () => {
    isGameOver = false;
    gameStarted = false;

    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('ui').innerText = "Destroy the AI opponent before it wrecks you!";
});

function updateCarPhysics(state, health, isAI) {
    let wheelHealthFactor = (health.fl + health.fr + health.rl + health.rr) / 400;
    let engineHealthFactor = health.engine / 100;

    let currentAccel = state.acceleration * engineHealthFactor;
    let currentTurn = state.turnSpeed * wheelHealthFactor;

    if (!isAI) {
        let throttleInput = 0;
        let steerInput = 0;

        if (keys['ArrowUp'] || keys['KeyW']) throttleInput -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) throttleInput += 1;
        if (keys['ArrowLeft'] || keys['KeyA']) steerInput -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) steerInput += 1;

        if (joystickInput.active) {
            throttleInput = joystickInput.y;
            steerInput = joystickInput.x;
        }

        if (throttleInput < -0.1) state.speed += currentAccel;
        else if (throttleInput > 0.1) state.speed -= currentAccel;

        if (Math.abs(steerInput) > 0.1) {
            state.angle -= currentTurn * steerInput * (Math.abs(state.speed) / state.maxSpeed || 0.3);
        }
    } else {
        const dx = playerState.x - state.x;
        const dz = playerState.z - state.z;
        const targetAngle = Math.atan2(dx, dz);
       
        let angleDiff = targetAngle - state.angle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        const playerSpeedMag = Math.abs(playerState.speed);
        const distToPlayer = Math.hypot(dx, dz);
        if (playerSpeedMag > 0.15 && distToPlayer < 7.0) {
            state.angle -= currentTurn * (angleDiff > 0 ? 1.5 : -1.5);
        } else {
            state.angle += Math.max(-currentTurn, Math.min(currentTurn, angleDiff));
        }

        state.speed += currentAccel * 0.8;
    }

    state.speed *= state.friction;
    state.speed = Math.max(-state.maxSpeed / 2, Math.min(state.maxSpeed, state.speed));

    state.x += Math.sin(state.angle) * state.speed;
    state.z += Math.cos(state.angle) * state.speed;

    const groundHeight = 0.0;
    if (state.y > groundHeight) {
        state.velocityY -= 0.02;
    } else {
        state.y = groundHeight;
        state.velocityY = 0;
    }
    state.y += state.velocityY;

    const distFromCenter = Math.hypot(state.x, state.z);
    const wallLimit = arenaRadius - 1.8;

    if (distFromCenter > wallLimit) {
        let impactVelocity = Math.abs(state.speed);
        if (impactVelocity > 0.04) {
            playCrashSound(false);
            let kineticForce = Math.round(impactVelocity * impactVelocity * 350 * state.damageMultiplier);
           
            health.engine -= kineticForce * 0.5;
            health.body -= kineticForce * 0.4;
            health.fl -= kineticForce * 0.2;
            health.fr -= kineticForce * 0.2;

            if (!isAI) updateHealthUI();
        }

        const hitAngle = Math.atan2(state.x, state.z);
        state.x = Math.sin(hitAngle) * wallLimit;
        state.z = Math.cos(hitAngle) * wallLimit;
        state.speed = -state.speed * 0.3;
    }
}

function checkCarVsCarCollision() {
    const dx = aiState.x - playerState.x;
    const dz = aiState.z - playerState.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 2.2) {
        playCrashSound(false);
       
        let relativeSpeed = Math.abs(playerState.speed - aiState.speed) + 0.15;
        let baseForce = relativeSpeed * relativeSpeed * 500;

        let playerDamage = Math.round(baseForce * playerState.damageMultiplier);
        let aiDamage = Math.round(baseForce * aiState.damageMultiplier);

        playerHealth.body -= playerDamage * 0.6;
        playerHealth.engine -= playerDamage * 0.4;
        aiHealth.body -= aiDamage * 0.6;
        aiHealth.engine -= aiDamage * 0.4;

        updateHealthUI();

        const collisionAngle = Math.atan2(dx, dz);
        playerState.x -= Math.sin(collisionAngle) * 0.5;
        playerState.z -= Math.cos(collisionAngle) * 0.5;
        aiState.x += Math.sin(collisionAngle) * 0.5;
        aiState.z += Math.cos(collisionAngle) * 0.5;

        playerState.speed = -playerState.speed * 0.4;
        aiState.speed = -aiState.speed * 0.4;
    }
}

function updateGame() {
    if (playerCar && aiCar) {
        playerCar.group.position.set(playerState.x, playerState.y, playerState.z);
        playerCar.group.rotation.y = playerState.angle;
        aiCar.group.position.set(aiState.x, aiState.y, aiState.z);
        aiCar.group.rotation.y = aiState.angle;
    }

    const camDist = 9;
    const camHeight = 4.5;
    camera.position.x = playerState.x - Math.sin(playerState.angle) * camDist;
    camera.position.z = playerState.z - Math.cos(playerState.angle) * camDist;
    camera.position.y = playerState.y + camHeight;
    camera.lookAt(playerState.x, playerState.y + 1.0, playerState.z);

    const groundHeight = 0.0;
    if (playerState.y > groundHeight) { playerState.y -= 0.02; }
    if (aiState.y > groundHeight) { aiState.y -= 0.02; }

    if (!gameStarted || isGameOver) return;

    updateCarPhysics(playerState, playerHealth, false);
    updateCarPhysics(aiState, aiHealth, true);
    checkCarVsCarCollision();

    let playerAvgHP = (playerHealth.engine + playerHealth.body + playerHealth.fl + playerHealth.fr + playerHealth.rl + playerHealth.rr) / 6;
    let aiAvgHP = (aiHealth.engine + aiHealth.body + aiHealth.fl + aiHealth.fr + aiHealth.rl + aiHealth.rr) / 6;

    let aiDead = aiAvgHP <= 10 || aiHealth.engine <= 0 || aiHealth.body <= 0;
    let playerDead = playerAvgHP <= 10 || playerHealth.engine <= 0 || playerHealth.body <= 0;

    if (aiDead && !playerDead) {
        isGameOver = true;
        playCrashSound(true);
        aiCar.bodyMat.color.setHex(0x111111);
        aiCar.cabinMat.color.setHex(0x111111);
        document.getElementById('resultText').innerText = "VICTORY!\nYou destroyed the opponent AI!";
        document.getElementById('resultScreen').style.display = 'flex';
        return;
    }

    if (playerDead && !aiDead) {
        isGameOver = true;
        playCrashSound(true);
        playerCar.bodyMat.color.setHex(0x111111);
        playerCar.cabinMat.color.setHex(0x111111);
        document.getElementById('resultText').innerText = "DEFEAT!\nYour vehicle was totaled.";
        document.getElementById('resultScreen').style.display = 'flex';
        return;
    }

    if (playerDead && aiDead) {
        isGameOver = true;
        playCrashSound(true);
        playerCar.bodyMat.color.setHex(0x111111);
        playerCar.cabinMat.color.setHex(0x111111);
        aiCar.bodyMat.color.setHex(0x111111);
        aiCar.cabinMat.color.setHex(0x111111);
        document.getElementById('resultText').innerText = "DRAW!\nBoth vehicles totaled simultaneously.";
        document.getElementById('resultScreen').style.display = 'flex';
        return;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Initialize default layout preview on home screen
initMatch('yukon');
updateHealthUI();
animate();

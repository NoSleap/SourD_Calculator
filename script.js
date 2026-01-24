let holdTimer = null;
let loopTimer = null;
let currentSpeed = 400;
let historyTrap = false;

const bannetonData = {
    'round': [
        { size: '5"', weight: 250, min: 200, max: 325 },
        { size: '6"', weight: 400, min: 300, max: 475 },
        { size: '7"', weight: 500, min: 450, max: 600 },
        { size: '8"', weight: 750, min: 600, max: 850 },
        { size: '9"', weight: 1000, min: 850, max: 1100 },
        { size: '10"', weight: 1250, min: 1100, max: 1500 }
    ],
    'oval': [
        { size: '6"', weight: 250, min: 200, max: 325 },
        { size: '8"', weight: 500, min: 400, max: 600 },
        { size: '9"', weight: 650, min: 550, max: 750 },
        { size: '10"', weight: 750, min: 700, max: 900 },
        { size: '11"', weight: 900, min: 800, max: 1050 },
        { size: '12"', weight: 1000, min: 900, max: 1200 }
    ]
};
let currentShape = 'round';
let currentSizeIndex = 4;
let limitMin = 0;
let limitMax = 10000;

function toggleExpand(id, btn) {
    document.getElementById(id).classList.toggle('open');
    btn.classList.toggle('active');
}

function resetAll() {
    if (confirm("Reset all settings to default?")) {
        document.getElementById('in-start').value = 150;
        document.getElementById('in-weight').value = 1000;
        document.getElementById('in-hyd').value = 70; 
        document.getElementById('in-salt').value = 2.0;
        document.getElementById('in-sec').value = 0;
        document.getElementById('in-st-hyd').value = 100;
        
        // Reset Banneton Mode
        document.getElementById('banneton-toggle').checked = false;
        toggleBannetonMode();
        
        calc();
    }
}

function hold(id, amount) {
    adj(id, amount);
    currentSpeed = 400; 
    holdTimer = setTimeout(() => { gravityLoop(id, amount); }, 500); 
}

function gravityLoop(id, amount) {
    adj(id, amount);
    currentSpeed = Math.max(30, currentSpeed * 0.85); 
    loopTimer = setTimeout(() => { gravityLoop(id, amount); }, currentSpeed);
}

function stop() { clearTimeout(holdTimer); clearTimeout(loopTimer); }

function adj(id, amount) {
    const el = document.getElementById('in-' + id);
    let currentVal = parseFloat(el.value);
    if (isNaN(currentVal)) currentVal = 0;
    
    let val = parseFloat((currentVal + amount).toFixed(1));
    if(val < 0) val = 0;

    if (id === 'weight' && document.getElementById('banneton-toggle').checked) {
        if (val < limitMin) val = limitMin;
        if (val > limitMax) val = limitMax;
    }

    el.value = val;
    calc();
}

// BANNETON MODE FUNCTIONS
function toggleBannetonMode() {
    const isOn = document.getElementById('banneton-toggle').checked;
    const controls = document.getElementById('banneton-controls');
    const linkIcon = document.getElementById('weight-link-icon');
    
    if (isOn) {
        controls.classList.remove('hidden');
        linkIcon.classList.remove('hidden');
        renderSizes(); // Initialize visuals
        setSize(currentSizeIndex); // Apply constraint immediately
    } else {
        controls.classList.add('hidden');
        linkIcon.classList.add('hidden');
    }
}

function setShape(shape) {
    currentShape = shape;
    currentSizeIndex = 0; // Reset to smallest of new shape (safest)
    
    // UI Update
    document.getElementById('shape-round').classList.toggle('active', shape === 'round');
    document.getElementById('shape-oval').classList.toggle('active', shape === 'oval');
    
    renderSizes();
    setSize(0); // Auto-select first size
}

function renderSizes() {
    const container = document.getElementById('size-carousel');
    container.innerHTML = '';
    
    const sizes = bannetonData[currentShape];
    sizes.forEach((item, index) => {
        const btn = document.createElement('div');
        btn.className = `size-pill ${currentShape}` + (index === currentSizeIndex ? ' active' : '');
        btn.innerText = item.size;
        btn.onclick = () => setSize(index);
        container.appendChild(btn);
    });
}

function setSize(index) {
    currentSizeIndex = index;
    const data = bannetonData[currentShape][index];

    limitMin = data.min;
    limitMax = data.max;
    
    const pills = document.querySelectorAll('.size-pill');
    pills.forEach((p, i) => {
        if(i === index) p.classList.add('active');
        else p.classList.remove('active');
    });

    document.getElementById('in-weight').value = data.weight;
    
    calc();
}

function calc() {
    const getVal = (id) => {
        const v = document.getElementById('in-' + id).value;
        return v === "" ? 0 : parseFloat(v);
    };

    const targetWeight = getVal('weight');
    const hyd = getVal('hyd') / 100;
    const starterAmt = getVal('start');
    const secPct = getVal('sec') / 100;
    const saltPct = getVal('salt') / 100;
    let starterHyd = getVal('st-hyd') / 100;
    if (starterHyd === 0) starterHyd = 1.0; 

    const starterFlour = starterAmt / (1 + starterHyd);
    const starterWater = starterAmt - starterFlour;

    const totalFlour = targetWeight / (1 + hyd + saltPct);
    const totalWater = totalFlour * hyd;
    const totalSalt  = totalFlour * saltPct;

    const secondaryFlourAmt = totalFlour * secPct;
    let primaryFlourAmt = totalFlour - secondaryFlourAmt - starterFlour;
    
    if (primaryFlourAmt < 0) primaryFlourAmt = 0;
    
    let addWater = totalWater - starterWater;
    if (addWater < 0) addWater = 0;

    document.getElementById('out-flour-1').innerText = Math.round(primaryFlourAmt) + 'g';
    document.getElementById('out-water').innerText = Math.round(addWater) + 'g';
    document.getElementById('out-start').innerText = starterAmt + 'g';
    document.getElementById('out-salt').innerText = totalSalt.toFixed(1) + 'g';
    
    const secRow = document.getElementById('row-sec');
    if (secPct > 0) {
        secRow.classList.remove('hidden');
        document.getElementById('out-flour-2').innerText = Math.round(secondaryFlourAmt) + 'g';
    } else {
        secRow.classList.add('hidden');
    }

    let inoc = 0, pff = 0;
    if(totalFlour > 0) {
        inoc = (starterAmt / totalFlour) * 100;
        pff = (starterFlour / totalFlour) * 100;
    }
    
    document.getElementById('stat-inoc').innerText = inoc.toFixed(1) + '%';
    document.getElementById('stat-pff').innerText = pff.toFixed(1) + '%';
    document.getElementById('stat-tf').innerText = Math.round(totalFlour) + 'g';
    document.getElementById('stat-tw').innerText = Math.round(totalWater) + 'g';

    // History Trap for Back Button
    const isClean = 
        document.getElementById('in-weight').value == "1000" &&
        document.getElementById('in-hyd').value == "70" &&
        document.getElementById('in-salt').value == "2.0" &&
        document.getElementById('in-start').value == "150" &&
        document.getElementById('in-sec').value == "0" &&
        document.getElementById('in-st-hyd').value == "100";

    if (!isClean && !historyTrap) {
        history.pushState({ dirty: true }, null, "");
        historyTrap = true;
    }
}

// Initial calculation
calc();

// Refresh / Close Tab Protection
window.addEventListener('beforeunload', (e) => {
    if (historyTrap) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Back Button Protection
window.addEventListener('popstate', (e) => {
    if (historyTrap) {
        if (confirm("Discard changes?")) {
            historyTrap = false; // Allow exit
            history.back();
        } else {
            history.pushState({ dirty: true }, null, ""); // Restore trap
        }
    }
});

/* INSTALL APP BUTTON */


// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
    // Show the install button
    installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
    installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    deferredPrompt = null;
});

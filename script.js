let holdTimer = null;
let loopTimer = null;
let currentSpeed = 400;
let historyTrap = false;
let toastTimer = null;

// Updated Banneton List with specific Min/Max/Default
const bannetonData = {
    'boule': [
        { size: '5"', weight: 300, min: 150, max: 350 },
        { size: '6"', weight: 400, min: 200, max: 500 },
        { size: '7"', weight: 600, min: 450, max: 725 },
        { size: '8"', weight: 750, min: 700, max: 1000 },
        { size: '9"', weight: 900, min: 800, max: 1100 },
        { size: '10"', weight: 1100, min: 950, max: 1300 },
        { size: '11"', weight: 1300, min: 1000, max: 1500 },
        { size: '12"', weight: 1500, min: 1100, max: 1800 }
    ],
    'batard': [
        { size: '7"', weight: 700, min: 350, max: 800 },
        { size: '9"', weight: 900, min: 600, max: 900 },
        { size: '10"', weight: 1000, min: 750, max: 1100 },
        { size: '11"', weight: 1100, min: 800, max: 1200 },
        { size: '12"', weight: 1200, min: 900, max: 1300 },
        { size: '14"', weight: 1400, min: 1100, max: 1400 }
    ]
};

let currentShape = 'boule';
let currentSizeIndex = 4; // Default 9" Boule
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
        document.getElementById('in-salt').value = 2.3;
        document.getElementById('in-sec').value = 0;
        document.getElementById('in-st-hyd').value = 100;
        
        // Reset Banneton Mode
        document.getElementById('banneton-toggle').checked = false;
        toggleBannetonMode();

        // Reset Inclusions Mode
        document.getElementById('inclusions-toggle').checked = false;
        toggleInclusionsMode();
        
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

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        t.classList.remove('show');
    }, 2000);
}

function adj(id, amount) {
    const el = document.getElementById('in-' + id);
    let currentVal = parseFloat(el.value);
    if (isNaN(currentVal)) currentVal = 0;
    
    let val = parseFloat((currentVal + amount).toFixed(1));
    if(val < 0) val = 0;
    if (id === 'st-hyd' && val > 100) val = 100;

    // Apply Banneton Limits and Toast
    if (id === 'weight' && document.getElementById('banneton-toggle').checked) {
        if (val < limitMin) {
            val = limitMin;
            if (currentVal <= limitMin) showToast("Min limit! Change banneton size down.");
        }
        if (val > limitMax) {
            val = limitMax;
            if (currentVal >= limitMax) showToast("Max limit! Change banneton size up.");
        }
    }

    el.value = val;
    calc();
}

// INCLUSIONS MODE FUNCTIONS
function toggleInclusionsMode() {
    const isOn = document.getElementById('inclusions-toggle').checked;
    const controls = document.getElementById('inclusions-controls');
    if (isOn) {
        controls.classList.remove('hidden');
    } else {
        controls.classList.add('hidden');
    }
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
        
        // Force Default: 9" Boule (Index 4)
        currentShape = 'boule';
        currentSizeIndex = 4;
        
        // Update Shape UI
        document.getElementById('shape-boule').classList.add('active');
        document.getElementById('shape-batard').classList.remove('active');
        
        renderSizes(); // Initialize visuals
        setSize(currentSizeIndex); // Apply constraint immediately
    } else {
        controls.classList.add('hidden');
        linkIcon.classList.add('hidden');
    }
}

function setShape(shape) {
    currentShape = shape;
    currentSizeIndex = 0; // Reset to smallest
    
    // UI Update
    document.getElementById('shape-boule').classList.toggle('active', shape === 'boule');
    document.getElementById('shape-batard').classList.toggle('active', shape === 'batard');
    
    renderSizes();
    setSize(0); // Auto-select first size
}

function renderSizes() {
    const container = document.getElementById('size-carousel');
    container.innerHTML = '';
    
    const sizes = bannetonData[currentShape];
    sizes.forEach((item, index) => {
        const btn = document.createElement('div');
        // 'boule' or 'batard' is added as a class for CSS styling
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

    // Inclusions
    const incRow = document.getElementById('row-inc');
    if (document.getElementById('inclusions-toggle').checked) {
        const incPct = getVal('inc') / 100;
        const incAmt = totalFlour * incPct;
        incRow.classList.remove('hidden');
        document.getElementById('out-inc').innerText = Math.round(incAmt) + 'g';
    } else {
        incRow.classList.add('hidden');
    }
    
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

// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    deferredPrompt = null;
});

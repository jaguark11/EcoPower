document.addEventListener('DOMContentLoaded', () => {
    const calcForm = document.getElementById('calcForm');
    
    if (calcForm) {
        const applianceSelect = document.getElementById('applianceSelect');
        const customPowerGroup = document.getElementById('customPowerGroup');
        const customPowerInput = document.getElementById('customPower');
        const qtyInput = document.getElementById('qtyInput');
        const qtyVal = document.getElementById('qtyVal');
        const hoursInput = document.getElementById('hoursInput');
        const hoursVal = document.getElementById('hoursVal');
        const addLoadBtn = document.getElementById('addLoadBtn');
        const loadList = document.getElementById('loadList');
        const clearBtn = document.getElementById('clearBtn');
        const advTotalEnergy = document.getElementById('advTotalEnergy');
        const kwhValue = document.getElementById('kwhValue');
        const advJarFill = document.getElementById('advJarFill');
        
        const MAX_ENERGY_FOR_JAR = 10000; 

        // Seeding de datos para que el sistema no nazca vacío
        const initialSeed = [
            { id: crypto.randomUUID(), name: "Foco LED", icon: "💡", power: 10, qty: 5, hours: 6, energy: 300, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "Refrigerador", icon: "❄️", power: 150, qty: 1, hours: 24, energy: 3600, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "Televisor", icon: "📺", power: 100, qty: 1, hours: 4, energy: 400, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "Consola Videojuegos", icon: "🎮", power: 400, qty: 1, hours: 2, energy: 800, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "Celular", icon: "📱", power: 15, qty: 2, hours: 3, energy: 90, timestamp: new Date().toISOString() }
        ];

        let currentLoads = [];
        const storageKey = 'ecoPower_system_state';

        const syncFromStorage = () => {
            const remoteData = localStorage.getItem(storageKey);
            if (remoteData) {
                currentLoads = JSON.parse(remoteData);
            } else {
                currentLoads = initialSeed;
                saveState();
            }
            renderEngine();
        };

        const saveState = () => {
            // Ordenamiento determinista como tie-breaker de seguridad
            currentLoads.sort((a, b) => a.id.localeCompare(b.id));
            localStorage.setItem(storageKey, JSON.stringify(currentLoads));
        };

        // Listener para concurrencia entre pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === storageKey && e.newValue) {
                currentLoads = JSON.parse(e.newValue);
                renderEngine();
            }
        });

        qtyInput.addEventListener('input', (e) => qtyVal.innerText = e.target.value);
        hoursInput.addEventListener('input', (e) => hoursVal.innerText = `${e.target.value} h`);

        applianceSelect.addEventListener('change', (e) => {
            customPowerGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        addLoadBtn.addEventListener('click', () => {
            let powerVal = 0, nodeName = "", nodeIcon = "";

            if (applianceSelect.value === 'custom') {
                powerVal = parseInt(customPowerInput.value) || 0;
                nodeName = "Personalizado";
                nodeIcon = "⚙️";
            } else {
                powerVal = parseInt(applianceSelect.value);
                const opt = applianceSelect.options[applianceSelect.selectedIndex];
                nodeName = opt.getAttribute('data-name');
                nodeIcon = opt.getAttribute('data-icon');
            }

            const qVal = parseInt(qtyInput.value) || 1;
            const hVal = parseInt(hoursInput.value) || 1;
            
            if (powerVal > 0 && qVal > 0 && hVal > 0) {
                const newLoad = {
                    id: crypto.randomUUID(),
                    name: nodeName,
                    icon: nodeIcon,
                    power: powerVal,
                    qty: qVal,
                    hours: hVal,
                    energy: powerVal * qVal * hVal,
                    timestamp: new Date().toISOString()
                };
                
                currentLoads.push(newLoad);
                saveState();
                renderEngine();
                
                // Reset
                applianceSelect.selectedIndex = 0;
                applianceSelect.dispatchEvent(new Event('change'));
                qtyInput.value = 1; qtyVal.innerText = "1";
                hoursInput.value = 1; hoursVal.innerText = "1 h";
            }
        });

        clearBtn.addEventListener('click', () => {
            currentLoads = [];
            saveState();
            renderEngine();
        });

        window.removeLoad = function(targetId) {
            currentLoads = currentLoads.filter(item => item.id !== targetId);
            saveState();
            renderEngine();
        };

        function renderEngine() {
            const totalWh = currentLoads.reduce((sum, item) => sum + item.energy, 0);
            kwhValue.innerText = (totalWh / 1000).toFixed(2);
            advTotalEnergy.innerText = totalWh;

            loadList.innerHTML = '';
            if (currentLoads.length === 0) {
                loadList.innerHTML = '<li class="empty-list">Sin datos de carga.</li>';
                clearBtn.style.display = 'none';
            } else {
                currentLoads.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${item.icon} ${item.name}</strong><br>
                            <small>${item.qty} un. × ${item.power}W × ${item.hours}h = <strong>${item.energy} Wh</strong></small>
                        </div>
                        <button class="remove-btn" onclick="removeLoad('${item.id}')" title="Depurar">×</button>
                    `;
                    loadList.appendChild(li);
                });
                clearBtn.style.display = 'block';
            }

            let fillRatio = (totalWh / MAX_ENERGY_FOR_JAR) * 100;
            advJarFill.style.height = `${Math.min(fillRatio, 100)}%`;
            
            if(fillRatio > 80) advJarFill.style.background = 'linear-gradient(0deg, #ef4444 0%, #fca5a5 100%)';
            else if (fillRatio > 40) advJarFill.style.background = 'linear-gradient(0deg, #f59e0b 0%, #fcd34d 100%)';
            else advJarFill.style.background = 'linear-gradient(0deg, var(--color-secondary) 0%, #a7f3d0 100%)';
        }

        // Init
        syncFromStorage();
    }
});

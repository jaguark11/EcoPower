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
        
        // El límite se establece en 30 kWh para soportar visualmente grandes cargas sin desbordar la interfaz
        const MAX_ENERGY_FOR_JAR = 30000; 

        // Estado inicial de la obra (Seeding estricto)
        const initialSeed = [
            { id: crypto.randomUUID(), name: "Tesla Model 3 (Wallbox)", icon: "🚗", power: 11500, qty: 1, hours: 2, energy: 23000, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "iPhone 15 Pro", icon: "📱", power: 20, qty: 1, hours: 2, energy: 40, timestamp: new Date().toISOString() },
            { id: crypto.randomUUID(), name: "Panel Solar Mono.", icon: "☀️", power: -400, qty: 5, hours: 5, energy: -10000, timestamp: new Date().toISOString() }
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
            // Ordenamiento determinista para garantizar consistencia estructural
            currentLoads.sort((a, b) => a.id.localeCompare(b.id));
            localStorage.setItem(storageKey, JSON.stringify(currentLoads));
        };

        // Bloqueo de concurrencia: Sincronización absoluta entre pestañas
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
                nodeName = "Registro Personalizado";
                nodeIcon = "⚙️";
            } else {
                powerVal = parseInt(applianceSelect.value);
                const opt = applianceSelect.options[applianceSelect.selectedIndex];
                nodeName = opt.getAttribute('data-name');
                nodeIcon = opt.getAttribute('data-icon');
            }

            const qVal = parseInt(qtyInput.value) || 1;
            const hVal = parseInt(hoursInput.value) || 1;
            
            // Validación estricta. Se aceptan valores negativos para representar la generación fotovoltaica
            if (powerVal !== 0 && qVal > 0 && hVal > 0) {
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
                
                // Purgar entradas tras el procesamiento
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
                loadList.innerHTML = '<li class="empty-list">Sin datos de carga o generación.</li>';
                clearBtn.style.display = 'none';
            } else {
                currentLoads.forEach(item => {
                    const li = document.createElement('li');
                    const isGen = item.power < 0;
                    
                    // Inyección de estilos dinámicos para distinguir la generación (verde) del consumo (azul)
                    li.style.borderLeftColor = isGen ? '#10b981' : '#3b82f6';
                    li.style.background = 'var(--color-surface)';
                    li.style.padding = '10px 15px';
                    li.style.borderRadius = '8px';
                    li.style.marginBottom = '10px';
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';
                    li.style.borderLeftWidth = '3px';
                    li.style.borderLeftStyle = 'solid';
                    li.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';

                    li.innerHTML = `
                        <div style="flex:1;">
                            <strong>${item.icon} ${item.name}</strong><br>
                            <small>${item.qty} un. × ${item.power}W × ${item.hours}h = <strong style="color: ${isGen ? '#10b981' : 'inherit'}">${item.energy} Wh</strong></small>
                        </div>
                        <button class="remove-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #ef4444;" onclick="removeLoad('${item.id}')" title="Depurar">×</button>
                    `;
                    loadList.appendChild(li);
                });
                clearBtn.style.display = 'block';
            }

            // Normalización visual: El tanque no puede "vaciarse" más allá del cero visualmente
            const displayWh = totalWh < 0 ? 0 : totalWh;
            let fillRatio = (displayWh / MAX_ENERGY_FOR_JAR) * 100;
            advJarFill.style.height = `${Math.min(fillRatio, 100)}%`;
            
            // Reacción térmica del tanque según la carga del sistema
            if (totalWh < 0) {
                advJarFill.style.background = 'linear-gradient(0deg, #10b981 0%, #34d399 100%)'; 
            } else if(fillRatio > 80) {
                advJarFill.style.background = 'linear-gradient(0deg, #ef4444 0%, #fca5a5 100%)';
            } else if (fillRatio > 40) {
                advJarFill.style.background = 'linear-gradient(0deg, #f59e0b 0%, #fcd34d 100%)';
            } else {
                advJarFill.style.background = 'linear-gradient(0deg, var(--color-secondary) 0%, #a7f3d0 100%)';
            }
        }

        // Ejecutar ignición
        syncFromStorage();
    }
});

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       Advanced Calculator Logic (V2)
    ========================================= */
    const calcForm = document.getElementById('calcForm');
    
    // Only run if we are on the calculator page
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
        
        // State
        let loads = [];
        const MAX_ENERGY_FOR_JAR = 5000; // 5 kWh to fill the visual jar completely

        // Listeners for Sliders to update text in real-time
        qtyInput.addEventListener('input', (e) => qtyVal.innerText = e.target.value);
        hoursInput.addEventListener('input', (e) => hoursVal.innerText = `${e.target.value} h`);

        // Listener for Select to show/hide custom power input
        applianceSelect.addEventListener('change', (e) => {
            if(e.target.value === 'custom') {
                customPowerGroup.style.display = 'block';
            } else {
                customPowerGroup.style.display = 'none';
            }
        });

        // Add Load to list
        addLoadBtn.addEventListener('click', () => {
            let power = 0;
            let name = "";
            let icon = "";

            if (applianceSelect.value === 'custom') {
                power = parseInt(customPowerInput.value) || 0;
                name = "Dispositivo Personalizado";
                icon = "⚙️";
            } else {
                power = parseInt(applianceSelect.value);
                const selectedOption = applianceSelect.options[applianceSelect.selectedIndex];
                name = selectedOption.getAttribute('data-name');
                icon = selectedOption.getAttribute('data-icon');
            }

            const qty = parseInt(qtyInput.value) || 1;
            const hours = parseInt(hoursInput.value) || 1;
            
            if (power > 0 && qty > 0 && hours > 0) {
                const energy = power * qty * hours;
                
                const load = {
                    id: Date.now(),
                    name,
                    icon,
                    power,
                    qty,
                    hours,
                    energy
                };
                
                loads.push(load);
                updateUI();
                
                // Reset form to defaults
                applianceSelect.selectedIndex = 0;
                applianceSelect.dispatchEvent(new Event('change'));
                qtyInput.value = 1; qtyVal.innerText = "1";
                hoursInput.value = 1; hoursVal.innerText = "1 h";
            }
        });

        // Clear All
        clearBtn.addEventListener('click', () => {
            loads = [];
            updateUI();
        });

        // Remove single item
        window.removeLoad = function(id) {
            loads = loads.filter(l => l.id !== id);
            updateUI();
        };

        // Core UI Update function Calculate E = P * Qty * Time
        function updateUI() {
            // Calculate Total Energy
            const totalEnergyWh = loads.reduce((sum, load) => sum + load.energy, 0);
            const totalEnergyKWh = (totalEnergyWh / 1000).toFixed(2);

            // Animate number
            animateValue(advTotalEnergy, parseInt(advTotalEnergy.innerText || 0), totalEnergyWh, 500);
            kwhValue.innerText = totalEnergyKWh;

            // Render List
            loadList.innerHTML = '';
            if (loads.length === 0) {
                loadList.innerHTML = '<li class="empty-list">No hay dispositivos añadidos.</li>';
                clearBtn.style.display = 'none';
            } else {
                loads.forEach(load => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${load.icon} ${load.name}</strong><br>
                            <small>${load.qty} un. × ${load.power}W × ${load.hours}h = <strong>${load.energy} Wh</strong></small>
                        </div>
                        <button class="remove-btn" onclick="removeLoad(${load.id})" title="Eliminar">×</button>
                    `;
                    loadList.appendChild(li);
                });
                clearBtn.style.display = 'block';
            }

            // Update Jar Fill visually
            let fillPercentage = (totalEnergyWh / MAX_ENERGY_FOR_JAR) * 100;
            if (fillPercentage > 100) fillPercentage = 100;
            advJarFill.style.height = `${fillPercentage}%`;
            
            // Change color dynamically if consumption is high
            if(fillPercentage > 80) {
                advJarFill.style.background = 'linear-gradient(0deg, #ef4444 0%, #fca5a5 100%)'; // Red for high
            } else if (fillPercentage > 40) {
                advJarFill.style.background = 'linear-gradient(0deg, #f59e0b 0%, #fcd34d 100%)'; // Orange/Yellow 
            } else {
                advJarFill.style.background = 'linear-gradient(0deg, var(--color-secondary) 0%, #a7f3d0 100%)'; // Green for normal
            }
        }

        // Helper to animate numbers
        function animateValue(obj, start, end, duration) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }
    }
});

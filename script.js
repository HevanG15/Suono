document.addEventListener('DOMContentLoaded', function() {
    // Theme switcher
    const toggleSwitch = document.querySelector('#checkbox');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleSwitch.checked = true;
    }
    
    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }
    
    toggleSwitch.addEventListener('change', switchTheme);
    
    // Mobile navigation
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    dropdownToggle.addEventListener('click', function() {
        dropdownMenu.classList.toggle('active');
        dropdownToggle.classList.toggle('active');
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (dropdownMenu.classList.contains('active')) {
                dropdownMenu.classList.remove('active');
                dropdownToggle.classList.remove('active');
            }
        });
    });
    
    // Section visibility on scroll
    const sections = document.querySelectorAll('.section');
    
    function checkSections() {
        const triggerBottom = window.innerHeight * 0.8;
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            
            if (sectionTop < triggerBottom) {
                section.classList.add('visible');
            }
        });
    }
    
    // Initial check for visible sections
    checkSections();
    
    // Check for visible sections on scroll
    window.addEventListener('scroll', checkSections);
    
    // Draw waveforms on canvases
    const waveCanvases = document.querySelectorAll('.wave-canvas');
    
    waveCanvases.forEach(canvas => {
        const waveType = canvas.getAttribute('data-type');
        const ctx = canvas.getContext('2d');
        
        drawWaveform(ctx, waveType, canvas.width, canvas.height);
    });
    
    // Draw waveform comparison for distortion section
    const cleanWaveCanvas = document.getElementById('clean-wave');
    const distortedWaveCanvas = document.getElementById('distorted-wave');
    
    if (cleanWaveCanvas && distortedWaveCanvas) {
        const cleanCtx = cleanWaveCanvas.getContext('2d');
        const distortedCtx = distortedWaveCanvas.getContext('2d');
        
        drawWaveform(cleanCtx, 'sine', cleanWaveCanvas.width, cleanWaveCanvas.height);
        drawDistortedWaveform(distortedCtx, distortedWaveCanvas.width, distortedWaveCanvas.height);
    }
    
    // Create EQ simulator
    createEQSimulator();
    
    // Create concept map
    createConceptMap();
    
    // Audio playback for wave types
    const playButtons = document.querySelectorAll('.play-button');
    let audioContext;
    let oscillator;
    
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const waveType = this.getAttribute('data-wave-type');
            playWaveform(waveType);
        });
    });
    
    // Functions
    function drawWaveform(ctx, type, width, height) {
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.lineWidth = 2;
        
        switch(type) {
            case 'sine':
                ctx.strokeStyle = '#3B82F6'; // Blue
                for (let x = 0; x < width; x++) {
                    const y = height / 2 + Math.sin(x * 0.05) * (height / 2 - 10);
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                break;
                
            case 'square':
                ctx.strokeStyle = '#10B981'; // Green
                const squareHeight = height / 2 - 10;
                for (let x = 0; x < width; x++) {
                    const period = 40;
                    const halfPeriod = period / 2;
                    const cyclePos = x % period;
                    const y = height / 2 + (cyclePos < halfPeriod ? -squareHeight : squareHeight);
                    
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                break;
                
            case 'triangle':
                ctx.strokeStyle = '#F59E0B'; // Amber
                const triangleHeight = height / 2 - 10;
                for (let x = 0; x < width; x++) {
                    const period = 40;
                    const cyclePos = x % period;
                    let y;
                    
                    if (cyclePos < period / 2) {
                        // Rising edge
                        y = height / 2 - triangleHeight + (cyclePos / (period / 2)) * (triangleHeight * 2);
                    } else {
                        // Falling edge
                        y = height / 2 + triangleHeight - ((cyclePos - period / 2) / (period / 2)) * (triangleHeight * 2);
                    }
                    
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                break;
        }
        
        ctx.stroke();
    }
    
    function drawDistortedWaveform(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#EF4444'; // Red
        
        const clippingThreshold = 0.3; // Threshold for clipping (0-1)
        
        for (let x = 0; x < width; x++) {
            let y = Math.sin(x * 0.05) * (height / 2 - 10);
            
            // Apply distortion (hard clipping)
            if (y > clippingThreshold * (height / 2 - 10)) {
                y = clippingThreshold * (height / 2 - 10);
            } else if (y < -clippingThreshold * (height / 2 - 10)) {
                y = -clippingThreshold * (height / 2 - 10);
            }
            
            y += height / 2; // Center on canvas
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    function createEQSimulator() {
        const eqSimulator = document.getElementById('eq-simulator');
        if (!eqSimulator) return;
        
        // Create EQ bands
        const bands = [
            { freq: '32Hz', color: '#FF5252' },
            { freq: '64Hz', color: '#FF7043' },
            { freq: '125Hz', color: '#FFCA28' },
            { freq: '250Hz', color: '#66BB6A' },
            { freq: '500Hz', color: '#26A69A' },
            { freq: '1kHz', color: '#42A5F5' },
            { freq: '2kHz', color: '#5C6BC0' },
            { freq: '4kHz', color: '#7E57C2' },
            { freq: '8kHz', color: '#AB47BC' },
            { freq: '16kHz', color: '#EC407A' }
        ];
        
        const eqHTML = `
            <div class="eq-container">
                ${bands.map((band, index) => `
                    <div class="eq-band">
                        <input type="range" min="-12" max="12" value="${Math.sin(index * 0.7) * 10}" class="eq-slider" style="background: ${band.color}">
                        <div class="eq-label">${band.freq}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        eqSimulator.innerHTML = eqHTML;
        
        // Add EQ slider styles
        const style = document.createElement('style');
        style.textContent = `
            .eq-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                height: 100%;
                padding: 20px 10px;
            }
            
            .eq-band {
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
            }
            
            .eq-slider {
                -webkit-appearance: slider-vertical;
                width: 20px;
                height: 200px;
                margin: 0 10px;
            }
            
            .eq-label {
                margin-top: 10px;
                font-size: 12px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
        
        // Add interactivity to sliders
        const sliders = eqSimulator.querySelectorAll('.eq-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', function() {
                // This would normally connect to audio processing
                // For demo purposes, we're just changing the appearance
                const value = parseInt(this.value);
                const hue = (value + 12) * 5; // Map -12 to 12 to a color range
                this.style.boxShadow = `0 0 10px hsl(${hue}, 80%, 60%)`;
            });
        });
    }
    
    function createConceptMap() {
        const conceptMap = document.getElementById('concept-map');
        if (!conceptMap) return;
        
        // Create a simple concept map visualization
        const mapHTML = `
            <svg width="100%" height="100%" viewBox="0 0 800 500">
                <!-- Central node -->
                <g class="node central-node">
                    <circle cx="400" cy="250" r="60" fill="var(--card-bg)" stroke="var(--primary-color)" stroke-width="3"/>
                    <text x="400" y="250" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-weight="bold">Suono</text>
                </g>
                
                <!-- Phase-based effects -->
                <g class="node phase-node">
                    <line x1="400" y1="250" x2="200" y2="150" stroke="var(--phase-color)" stroke-width="2"/>
                    <circle cx="200" cy="150" r="40" fill="var(--card-bg)" stroke="var(--phase-color)" stroke-width="3"/>
                    <text x="200" y="150" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)">Fase</text>
                    
                    <line x1="200" y1="150" x2="100" y2="100" stroke="var(--phase-color)" stroke-width="2"/>
                    <circle cx="100" cy="100" r="30" fill="var(--card-bg)" stroke="var(--phase-color)" stroke-width="2"/>
                    <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-size="12">Phaser</text>
                    
                    <line x1="200" y1="150" x2="150" y2="220" stroke="var(--phase-color)" stroke-width="2"/>
                    <circle cx="150" cy="220" r="30" fill="var(--card-bg)" stroke="var(--phase-color)" stroke-width="2"/>
                    <text x="150" y="220" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-size="12">Flanger</text>
                </g>
                
                <!-- Time-based effects -->
                <g class="node time-node">
                    <line x1="400" y1="250" x2="250" y2="350" stroke="var(--time-color)" stroke-width="2"/>
                    <circle cx="250" cy="350" r="40" fill="var(--card-bg)" stroke="var(--time-color)" stroke-width="3"/>
                    <text x="250" y="350" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)">Tempo</text>
                    
                    <line x1="250" y1="350" x2="150" y2="400" stroke="var(--time-color)" stroke-width="2"/>
                    <circle cx="150" cy="400" r="30" fill="var(--card-bg)" stroke="var(--time-color)" stroke-width="2"/>
                    <text x="150" y="400" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-size="12">Chorus</text>
                </g>
                
                <!-- Frequency-based effects -->
                <g class="node freq-node">
                    <line x1="400" y1="250" x2="550" y2="350" stroke="var(--freq-color)" stroke-width="2"/>
                    <circle cx="550" cy="350" r="40" fill="var(--card-bg)" stroke="var(--freq-color)" stroke-width="3"/>
                    <text x="550" y="350" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)">Frequenza</text>
                    
                    <line x1="550" y1="350" x2="650" y2="400" stroke="var(--freq-color)" stroke-width="2"/>
                    <circle cx="650" cy="400" r="30" fill="var(--card-bg)" stroke="var(--freq-color)" stroke-width="2"/>
                    <text x="650" y="400" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-size="12">EQ</text>
                </g>
                
                <!-- Amplitude-based effects -->
                <g class="node amp-node">
                    <line x1="400" y1="250" x2="600" y2="150" stroke="var(--amp-color)" stroke-width="2"/>
                    <circle cx="600" cy="150" r="40" fill="var(--card-bg)" stroke="var(--amp-color)" stroke-width="3"/>
                    <text x="600" y="150" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)">Ampiezza</text>
                    
                    <line x1="600" y1="150" x2="700" y2="100" stroke="var(--amp-color)" stroke-width="2"/>
                    <circle cx="700" cy="100" r="30" fill="var(--card-bg)" stroke="var(--amp-color)" stroke-width="2"/>
                    <text x="700" y="100" text-anchor="middle" dominant-baseline="middle" fill="var(--text-color)" font-size="12">Distorsione</text>
                </g>
            </svg>
        `;
        
        conceptMap.innerHTML = mapHTML;
        
        // Add hover effects
        const style = document.createElement('style');
        style.textContent = `
            .node circle {
                transition: all 0.3s ease;
            }
            
            .node:hover circle {
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    function playWaveform(type) {
        // Stop any playing sound
        if (oscillator) {
            oscillator.stop();
            oscillator = null;
        }
        
        // Create audio context if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create oscillator
        oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Set oscillator type
        oscillator.type = type;
        oscillator.frequency.value = 440; // A4 note
        
        // Set volume
        gainNode.gain.value = 0.3;
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop oscillator
        oscillator.start();
        
        // Stop after 1 second
        setTimeout(() => {
            if (oscillator) {
                oscillator.stop();
                oscillator = null;
            }
        }, 1000);
    }
    
    // Animate waveform on main canvas
    const waveformCanvas = document.getElementById('waveformCanvas');
    if (waveformCanvas) {
        const ctx = waveformCanvas.getContext('2d');
        let time = 0;
        
        function animateWaveforms() {
            time += 0.05;
            ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
            
            // Draw sine wave
            ctx.beginPath();
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            
            for (let x = 0; x < waveformCanvas.width; x++) {
                const y = waveformCanvas.height / 6 + Math.sin((x * 0.02) + time) * 30;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Draw square wave
            ctx.beginPath();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 2;
            
            for (let x = 0; x < waveformCanvas.width; x++) {
                const period = 100;
                const halfPeriod = period / 2;
                const cyclePos = (x + time * 10) % period;
                const y = waveformCanvas.height / 2 + (cyclePos < halfPeriod ? -30 : 30);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Draw triangle wave
            ctx.beginPath();
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            
            for (let x = 0; x < waveformCanvas.width; x++) {
                const period = 100;
                const cyclePos = (x + time * 10) % period;
                let y;
                
                if (cyclePos < period / 2) {
                    // Rising edge
                    y = waveformCanvas.height * 5/6 - 30 + (cyclePos / (period / 2)) * 60;
                } else {
                    // Falling edge
                    y = waveformCanvas.height * 5/6 + 30 - ((cyclePos - period / 2) / (period / 2)) * 60;
                }
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            requestAnimationFrame(animateWaveforms);
        }
        
        animateWaveforms();
    }
});

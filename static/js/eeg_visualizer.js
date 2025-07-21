// EEG Visualizer JavaScript - Main application logic for real-time brainwave visualization

// Global variables to store application state and data
let socket = null;                    // WebSocket connection to the server
let isConnected = false;              // Connection status flag
let isStreaming = false;              // Streaming status flag
let waveData = {};                    // Store current wave data
let rawDataHistory = [];              // History of raw EEG data for visualization
const MAX_HISTORY = 500;              // Maximum number of data points to keep in history

// Canvas contexts for drawing different visualizations
let deltaCtx, thetaCtx, alphaCtx, betaCtx, gammaCtx, combinedCtx, rawDataCtx;

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('EEG Visualizer initializing...');
    
    // Initialize canvas contexts for drawing
    initializeCanvases();
    
    // Set up event listeners for control buttons
    setupEventListeners();
    
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Start the status update loop
    updateStatus();
});

// Initialize all canvas elements and their 2D contexts
function initializeCanvases() {
    // Get canvas elements for each brainwave type
    const deltaCanvas = document.getElementById('deltaCanvas');
    const thetaCanvas = document.getElementById('thetaCanvas');
    const alphaCanvas = document.getElementById('alphaCanvas');
    const betaCanvas = document.getElementById('betaCanvas');
    const gammaCanvas = document.getElementById('gammaCanvas');
    const combinedCanvas = document.getElementById('combinedCanvas');
    const rawDataCanvas = document.getElementById('rawDataCanvas');
    
    // Get 2D drawing contexts for each canvas
    deltaCtx = deltaCanvas.getContext('2d');
    thetaCtx = thetaCanvas.getContext('2d');
    alphaCtx = alphaCanvas.getContext('2d');
    betaCtx = betaCanvas.getContext('2d');
    gammaCtx = gammaCanvas.getContext('2d');
    combinedCtx = combinedCanvas.getContext('2d');
    rawDataCtx = rawDataCanvas.getContext('2d');
    
    // Set canvas dimensions and clear them
    const canvases = [deltaCanvas, thetaCanvas, alphaCanvas, betaCanvas, gammaCanvas, combinedCanvas, rawDataCanvas];
    canvases.forEach(canvas => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        clearCanvas(canvas.getContext('2d'), canvas.width, canvas.height);
    });
}

// Set up event listeners for all control buttons
function setupEventListeners() {
    // Connect button - establishes connection to Muse 2 headband
    document.getElementById('connectBtn').addEventListener('click', function() {
        console.log('Connecting to Muse 2...');
        fetch('/api/connect', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Successfully connected to Muse 2!', 'success');
                    updateButtonStates(true, false, false, true);
                } else {
                    showNotification('Failed to connect: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Connection error:', error);
                showNotification('Connection error: ' + error.message, 'error');
            });
    });
    
    // Start streaming button - begins EEG data streaming
    document.getElementById('startBtn').addEventListener('click', function() {
        console.log('Starting EEG streaming...');
        fetch('/api/start_streaming', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Started streaming EEG data!', 'success');
                    updateButtonStates(true, true, true, true);
                    isStreaming = true;
                } else {
                    showNotification('Failed to start streaming: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Streaming error:', error);
                showNotification('Streaming error: ' + error.message, 'error');
            });
    });
    
    // Stop streaming button - stops EEG data streaming
    document.getElementById('stopBtn').addEventListener('click', function() {
        console.log('Stopping EEG streaming...');
        fetch('/api/stop_streaming', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Stopped streaming EEG data!', 'info');
                    updateButtonStates(true, false, false, true);
                    isStreaming = false;
                } else {
                    showNotification('Failed to stop streaming: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Stop streaming error:', error);
                showNotification('Stop streaming error: ' + error.message, 'error');
            });
    });
    
    // Disconnect button - disconnects from Muse 2 headband
    document.getElementById('disconnectBtn').addEventListener('click', function() {
        console.log('Disconnecting from Muse 2...');
        fetch('/api/disconnect', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Disconnected from Muse 2!', 'info');
                    updateButtonStates(false, false, false, false);
                    isConnected = false;
                    isStreaming = false;
                } else {
                    showNotification('Failed to disconnect: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Disconnect error:', error);
                showNotification('Disconnect error: ' + error.message, 'error');
            });
    });
}

// Initialize WebSocket connection for real-time data streaming
function initializeWebSocket() {
    // Create Socket.IO connection to the server
    socket = io();
    
    // Handle successful connection to the server
    socket.on('connect', function() {
        console.log('Connected to EEG server via WebSocket');
        isConnected = true;
    });
    
    // Handle disconnection from the server
    socket.on('disconnect', function() {
        console.log('Disconnected from EEG server');
        isConnected = false;
    });
    
    // Handle incoming EEG data from the server
    socket.on('eeg_data', function(data) {
        console.log('Received EEG data:', data);
        
        // Store the wave data for processing
        waveData = data;
        
        // Update all visualizations with the new data
        updateWaveVisualizations(data);
        updateActivityRanking(data);
        updateMentalState(data);
        updateRawDataVisualization(data);
    });
    
    // Handle error messages from the server
    socket.on('error', function(data) {
        console.error('Server error:', data);
        showNotification('Server error: ' + data.message, 'error');
    });
    
    // Handle status messages from the server
    socket.on('status', function(data) {
        console.log('Server status:', data);
        showNotification(data.message, 'info');
    });
}

// Update the visualizations for individual brainwaves
function updateWaveVisualizations(data) {
    // Extract wave powers from the data
    const wavePowers = data.wave_powers || {};
    
    // Update each individual wave visualization
    updateSingleWaveVisualization('delta', wavePowers.delta || 0, deltaCtx);
    updateSingleWaveVisualization('theta', wavePowers.theta || 0, thetaCtx);
    updateSingleWaveVisualization('alpha', wavePowers.alpha || 0, alphaCtx);
    updateSingleWaveVisualization('beta', wavePowers.beta || 0, betaCtx);
    updateSingleWaveVisualization('gamma', wavePowers.gamma || 0, gammaCtx);
    
    // Update combined wave visualization
    updateCombinedWaveVisualization(wavePowers, combinedCtx);
    
    // Update progress bars and power displays
    updateProgressBars(data.wave_percentages || {});
    updatePowerDisplays(wavePowers);
}

// Update visualization for a single brainwave type
function updateSingleWaveVisualization(waveType, power, ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    clearCanvas(ctx, width, height);
    
    // Normalize power to a reasonable range for visualization
    const normalizedPower = Math.min(power * 1000, 1.0);
    
    // Generate wave pattern based on the wave type
    const frequency = getWaveFrequency(waveType);
    const amplitude = normalizedPower * height * 0.3;
    
    // Draw the wave pattern
    ctx.strokeStyle = getWaveColor(waveType);
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
        const time = x / width * 4 * Math.PI; // 2 complete cycles
        const y = height / 2 + Math.sin(time * frequency) * amplitude;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
}

// Update the combined wave visualization showing all waves together
function updateCombinedWaveVisualization(wavePowers, ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    clearCanvas(ctx, width, height);
    
    // Draw each wave type with different colors and offsets
    const waves = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    const offsets = [0, height * 0.2, height * 0.4, height * 0.6, height * 0.8];
    
    waves.forEach((waveType, index) => {
        const power = wavePowers[waveType] || 0;
        const normalizedPower = Math.min(power * 1000, 1.0);
        const frequency = getWaveFrequency(waveType);
        const amplitude = normalizedPower * height * 0.1;
        const offset = offsets[index];
        
        ctx.strokeStyle = getWaveColor(waveType);
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const time = x / width * 4 * Math.PI;
            const y = offset + Math.sin(time * frequency) * amplitude;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    });
}

// Update the activity ranking display showing which waves are most active
function updateActivityRanking(data) {
    const rankingContainer = document.getElementById('activityRanking');
    const rankings = data.wave_rankings || [];
    const percentages = data.wave_percentages || {};
    
    if (rankings.length === 0) {
        rankingContainer.innerHTML = '<p class="text-muted">No data available</p>';
        return;
    }
    
    // Create HTML for the ranking display
    let rankingHTML = '<div class="list-group">';
    
    rankings.forEach((ranking, index) => {
        const waveName = ranking[0];
        const power = ranking[1];
        const percentage = percentages[waveName] || 0;
        
        // Create a list item for each wave ranking
        rankingHTML += `
            <div class="list-group-item d-flex justify-content-between align-items-center" 
                 style="background: rgba(255,255,255,0.1); border: none; color: white;">
                <div>
                    <span class="badge bg-primary me-2">#${index + 1}</span>
                    <strong>${waveName.charAt(0).toUpperCase() + waveName.slice(1)}</strong>
                    <small class="text-muted ms-2">(${getWaveDescription(waveName)})</small>
                </div>
                <div>
                    <span class="badge bg-success">${percentage.toFixed(1)}%</span>
                    <small class="text-muted ms-2">${power.toFixed(4)}</small>
                </div>
            </div>
        `;
    });
    
    rankingHTML += '</div>';
    rankingContainer.innerHTML = rankingHTML;
}

// Update the mental state display based on dominant brainwave
function updateMentalState(data) {
    const dominantStateElement = document.getElementById('dominantState');
    const stateDescriptionElement = document.getElementById('stateDescription');
    
    const dominantState = data.dominant_state || 'Unknown';
    const stateDescription = getStateDescription(dominantState);
    
    // Update the display with current mental state
    dominantStateElement.textContent = dominantState;
    dominantStateElement.className = 'text-center pulse'; // Add pulsing animation
    
    stateDescriptionElement.textContent = stateDescription;
}

// Update progress bars showing relative activity of each wave
function updateProgressBars(percentages) {
    const waveTypes = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    
    waveTypes.forEach(waveType => {
        const progressElement = document.getElementById(waveType + 'Progress');
        const percentage = percentages[waveType] || 0;
        
        if (progressElement) {
            progressElement.style.width = percentage + '%';
        }
    });
}

// Update power display values for each wave
function updatePowerDisplays(wavePowers) {
    const waveTypes = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    
    waveTypes.forEach(waveType => {
        const powerElement = document.getElementById(waveType + 'Power');
        const power = wavePowers[waveType] || 0;
        
        if (powerElement) {
            powerElement.textContent = power.toFixed(4);
        }
    });
}

// Update raw EEG data visualization
function updateRawDataVisualization(data) {
    const rawData = data.raw_data || {};
    const channels = Object.keys(rawData);
    
    if (channels.length === 0) return;
    
    // Add new data to history
    rawDataHistory.push({
        timestamp: data.timestamp || Date.now(),
        data: rawData
    });
    
    // Keep only the most recent data points
    if (rawDataHistory.length > MAX_HISTORY) {
        rawDataHistory.shift();
    }
    
    // Draw the raw data visualization
    drawRawDataVisualization();
}

// Draw the raw EEG data as a multi-channel waveform
function drawRawDataVisualization() {
    const canvas = rawDataCtx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    clearCanvas(rawDataCtx, width, height);
    
    if (rawDataHistory.length < 2) return;
    
    // Get all available channels
    const channels = Object.keys(rawDataHistory[0].data);
    const channelHeight = height / channels.length;
    
    // Draw each channel
    channels.forEach((channel, channelIndex) => {
        const yOffset = channelIndex * channelHeight;
        
        // Set channel color
        rawDataCtx.strokeStyle = getChannelColor(channelIndex);
        rawDataCtx.lineWidth = 1;
        rawDataCtx.beginPath();
        
        // Draw the waveform for this channel
        rawDataHistory.forEach((point, index) => {
            const x = (index / (rawDataHistory.length - 1)) * width;
            const value = point.data[channel] || 0;
            const y = yOffset + channelHeight / 2 + (value * channelHeight * 0.3);
            
            if (index === 0) {
                rawDataCtx.moveTo(x, y);
            } else {
                rawDataCtx.lineTo(x, y);
            }
        });
        
        rawDataCtx.stroke();
        
        // Add channel label
        rawDataCtx.fillStyle = 'white';
        rawDataCtx.font = '12px Arial';
        rawDataCtx.fillText(channel, 10, yOffset + 20);
    });
}

// Helper function to get frequency for wave visualization
function getWaveFrequency(waveType) {
    const frequencies = {
        'delta': 0.5,
        'theta': 1.0,
        'alpha': 1.5,
        'beta': 2.5,
        'gamma': 3.5
    };
    return frequencies[waveType] || 1.0;
}

// Helper function to get color for each wave type
function getWaveColor(waveType) {
    const colors = {
        'delta': '#ff6b6b',
        'theta': '#feca57',
        'alpha': '#48dbfb',
        'beta': '#1dd1a1',
        'gamma': '#ff9ff3'
    };
    return colors[waveType] || '#ffffff';
}

// Helper function to get color for each channel
function getChannelColor(channelIndex) {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'];
    return colors[channelIndex % colors.length];
}

// Helper function to get description for each wave type
function getWaveDescription(waveType) {
    const descriptions = {
        'delta': 'Deep sleep, unconscious',
        'theta': 'Meditation, creativity',
        'alpha': 'Relaxed wakefulness',
        'beta': 'Active thinking',
        'gamma': 'High-level processing'
    };
    return descriptions[waveType] || 'Unknown';
}

// Helper function to get description for mental state
function getStateDescription(state) {
    const descriptions = {
        'Deep Relaxation/Sleep': 'You are in a deeply relaxed state, possibly approaching sleep.',
        'Creative/Meditative': 'Your mind is in a creative, meditative state with increased theta activity.',
        'Relaxed Wakefulness': 'You are awake but relaxed, with your eyes likely closed.',
        'Active Thinking': 'You are actively thinking, concentrating, or problem-solving.',
        'High-Level Processing': 'Your brain is engaged in high-level cognitive processing.',
        'Low Activity': 'Brain activity is currently low or unclear.',
        'Unknown': 'Unable to determine current mental state.'
    };
    return descriptions[state] || 'Current mental state is unclear.';
}

// Clear a canvas with a dark background
function clearCanvas(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
}

// Update button states based on connection and streaming status
function updateButtonStates(connected, streaming, canStart, canDisconnect) {
    document.getElementById('connectBtn').disabled = connected;
    document.getElementById('startBtn').disabled = !canStart;
    document.getElementById('stopBtn').disabled = !streaming;
    document.getElementById('disconnectBtn').disabled = !canDisconnect;
}

// Update connection status display
function updateStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const connection = data.connection;
                const statusIndicator = document.querySelector('.status-indicator');
                const statusText = document.getElementById('statusText');
                
                if (connection.connected) {
                    statusIndicator.className = 'status-indicator status-connected';
                    statusText.textContent = connection.streaming ? 'Streaming' : 'Connected';
                    isConnected = true;
                } else {
                    statusIndicator.className = 'status-indicator status-disconnected';
                    statusText.textContent = 'Disconnected';
                    isConnected = false;
                }
            }
        })
        .catch(error => {
            console.error('Status update error:', error);
        });
    
    // Update status every 2 seconds
    setTimeout(updateStatus, 2000);
}

// Show notification messages to the user
function showNotification(message, type) {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
} 
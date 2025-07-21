# Muse 2 EEG Brainwave Visualizer

A real-time EEG visualization and analysis application that connects to the Muse 2 headband to display and analyze brainwave activity. The application provides comprehensive visualization of individual brainwave types (Delta, Theta, Alpha, Beta, Gamma) and intelligent analysis of mental states.

## Features

### 🧠 Real-time Brainwave Visualization
- **Individual Wave Display**: Separate visualizations for each brainwave type
- **Combined View**: All waves displayed together for comparison
- **Raw EEG Data**: Multi-channel waveform display
- **Live Updates**: Real-time data streaming at 10 FPS

### 📊 Advanced Analysis
- **Activity Ranking**: Shows brainwaves from most to least active
- **Mental State Detection**: Identifies current mental state based on dominant waves
- **Power Spectrum Analysis**: Real-time frequency domain analysis
- **Percentage Calculations**: Relative power distribution across wave types

### 🎨 Beautiful Interface
- **Modern UI**: Dark theme with gradient backgrounds
- **Interactive Controls**: Easy connection and streaming management
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Animations**: Smooth visual updates and transitions

## Brainwave Types Analyzed

| Wave Type | Frequency Range | Mental State | Description |
|-----------|----------------|--------------|-------------|
| **Delta** | 0.5-4 Hz | Deep Relaxation/Sleep | Deep sleep, unconscious processes |
| **Theta** | 4-8 Hz | Creative/Meditative | Drowsiness, meditation, creativity |
| **Alpha** | 8-13 Hz | Relaxed Wakefulness | Relaxed wakefulness, closed eyes |
| **Beta** | 13-30 Hz | Active Thinking | Active thinking, concentration |
| **Gamma** | 30-100 Hz | High-Level Processing | High-level processing, insight |

## Prerequisites

### Hardware Requirements
- **Muse 2 Headband**: Interaxon Muse 2 EEG headband
- **Computer**: Windows, macOS, or Linux with Bluetooth capability

### Software Requirements
- **Muse Direct**: Download from [Interaxon's website](https://choosemuse.com/muse-direct/)
- **Python 3.8+**: For running the application
- **Bluetooth Connection**: For Muse 2 connectivity

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd muse2-eeg-visualizer
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install Muse Direct
1. Download Muse Direct from [Interaxon's website](https://choosemuse.com/muse-direct/)
2. Install and run Muse Direct
3. Connect your Muse 2 headband via Bluetooth
4. Configure Muse Direct to stream to LSL (Lab Streaming Layer)

## Setup Instructions

### Step 1: Connect Muse 2 Headband
1. Turn on your Muse 2 headband
2. Open Muse Direct application
3. Connect to your Muse 2 via Bluetooth
4. Ensure the headband is properly positioned on your head

### Step 2: Configure Muse Direct for LSL Streaming
1. In Muse Direct, go to Settings
2. Enable "Stream to LSL" option
3. Set the stream name (e.g., "Muse2-EEG")
4. Start the LSL stream

### Step 3: Run the Application
```bash
python app.py
```

### Step 4: Access the Web Interface
1. Open your web browser
2. Navigate to `http://localhost:5000`
3. Click "Connect" to establish connection with Muse 2
4. Click "Start Streaming" to begin visualization

## Usage Guide

### Connection Process
1. **Connect**: Establishes connection to Muse 2 headband via LSL
2. **Start Streaming**: Begins real-time EEG data collection and visualization
3. **Stop Streaming**: Pauses data collection while maintaining connection
4. **Disconnect**: Completely disconnects from the headband

### Understanding the Interface

#### Control Panel
- **Connection Status**: Shows current connection state (Connected/Disconnected/Streaming)
- **Control Buttons**: Manage connection and streaming states

#### Brainwave Activity Ranking
- **Real-time Rankings**: Shows brainwaves ordered by activity level
- **Percentage Display**: Relative power distribution
- **Power Values**: Absolute power measurements

#### Current Mental State
- **State Detection**: Automatically identifies your mental state
- **State Description**: Explains what the detected state means
- **Real-time Updates**: Updates as your mental state changes

#### Individual Wave Visualizations
- **Wave Patterns**: Animated sine wave patterns representing each brainwave
- **Progress Bars**: Visual representation of relative activity
- **Power Values**: Numerical power measurements

#### Raw EEG Data
- **Multi-channel Display**: Shows raw EEG signals from all channels
- **Real-time Scrolling**: Continuous waveform display
- **Channel Labels**: Identifies each EEG channel (TP9, AF7, AF8, TP10)

## Technical Architecture

### Backend Components

#### `eeg_processor.py`
- **Signal Processing**: FFT analysis for frequency domain conversion
- **Wave Analysis**: Power calculation for each frequency band
- **Ranking Algorithm**: Real-time sorting of brainwave activity
- **State Detection**: Mental state classification logic

#### `muse_connector.py`
- **LSL Integration**: Connects to Muse 2 via Lab Streaming Layer
- **Data Streaming**: Real-time EEG data collection
- **Connection Management**: Handles connection states and errors

#### `app.py`
- **Flask Server**: Web server for the application
- **WebSocket Communication**: Real-time data broadcasting
- **API Endpoints**: RESTful API for connection management
- **Data Broadcasting**: Sends processed data to frontend

### Frontend Components

#### `templates/index.html`
- **User Interface**: Complete web interface layout
- **Responsive Design**: Mobile-friendly responsive layout
- **Canvas Elements**: HTML5 canvases for wave visualization

#### `static/js/eeg_visualizer.js`
- **Real-time Visualization**: Canvas-based wave drawing
- **WebSocket Client**: Receives data from server
- **Interactive Controls**: Button event handling
- **Data Processing**: Frontend data analysis and display

## Troubleshooting

### Common Issues

#### Connection Problems
- **Issue**: "No Muse 2 headband found"
  - **Solution**: Ensure Muse Direct is running and streaming to LSL
  - **Solution**: Check Bluetooth connection to Muse 2
  - **Solution**: Verify Muse 2 is turned on and properly positioned

#### Data Quality Issues
- **Issue**: Poor signal quality or noise
  - **Solution**: Ensure Muse 2 sensors are in contact with your head
  - **Solution**: Check for hair interference with sensors
  - **Solution**: Ensure proper headband positioning

#### Performance Issues
- **Issue**: Laggy or slow visualization
  - **Solution**: Close other applications to free up system resources
  - **Solution**: Check internet connection for WebSocket communication
  - **Solution**: Reduce browser tab count

### Error Messages

#### "Failed to connect to Muse 2"
- Muse Direct not running
- LSL streaming not enabled
- Bluetooth connection issues

#### "No data available"
- Muse 2 not properly positioned
- Poor sensor contact
- Headband not turned on

## Development

### Project Structure
```
muse2-eeg-visualizer/
├── app.py                 # Main Flask application
├── eeg_processor.py       # EEG signal processing
├── muse_connector.py      # Muse 2 connection handling
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main web interface
└── static/
    └── js/
        └── eeg_visualizer.js  # Frontend JavaScript
```

### Adding New Features
1. **Backend**: Add processing logic to `eeg_processor.py`
2. **API**: Add endpoints to `app.py`
3. **Frontend**: Update HTML and JavaScript files
4. **Testing**: Test with real Muse 2 data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Interaxon**: For the Muse 2 headband and Muse Direct software
- **Lab Streaming Layer (LSL)**: For real-time data streaming
- **Bootstrap**: For the responsive UI framework
- **Socket.IO**: For real-time WebSocket communication

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the Muse Direct documentation
3. Open an issue on the project repository

---

**Note**: This application is for educational and research purposes. Always follow proper safety guidelines when using EEG equipment. 
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import json
import time
import threading
from eeg_processor import EEGProcessor
from muse_connector import MuseConnector

app = Flask(__name__)
app.config['SECRET_KEY'] = 'eeg_visualization_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global instances
eeg_processor = EEGProcessor()
muse_connector = MuseConnector(eeg_processor)

# Data broadcasting thread
broadcast_thread = None
is_broadcasting = False

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/connect', methods=['POST'])
def connect_muse():
    """Connect to Muse 2 headband"""
    try:
        success = muse_connector.connect_to_muse()
        return jsonify({
            'success': success,
            'message': 'Connected to Muse 2' if success else 'Failed to connect to Muse 2'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/api/disconnect', methods=['POST'])
def disconnect_muse():
    """Disconnect from Muse 2 headband"""
    try:
        muse_connector.disconnect()
        stop_broadcasting()
        return jsonify({
            'success': True,
            'message': 'Disconnected from Muse 2'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/api/start_streaming', methods=['POST'])
def start_streaming():
    """Start streaming EEG data"""
    try:
        success = muse_connector.start_streaming()
        if success:
            start_broadcasting()
        
        return jsonify({
            'success': success,
            'message': 'Started streaming' if success else 'Failed to start streaming'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/api/stop_streaming', methods=['POST'])
def stop_streaming():
    """Stop streaming EEG data"""
    try:
        muse_connector.stop_streaming()
        stop_broadcasting()
        return jsonify({
            'success': True,
            'message': 'Stopped streaming'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/api/status')
def get_status():
    """Get current connection and streaming status"""
    try:
        connection_status = muse_connector.get_connection_status()
        return jsonify({
            'success': True,
            'connection': connection_status,
            'broadcasting': is_broadcasting
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

def start_broadcasting():
    """Start broadcasting EEG data to connected clients"""
    global broadcast_thread, is_broadcasting
    
    if not is_broadcasting:
        is_broadcasting = True
        broadcast_thread = threading.Thread(target=broadcast_data)
        broadcast_thread.daemon = True
        broadcast_thread.start()

def stop_broadcasting():
    """Stop broadcasting EEG data"""
    global is_broadcasting
    is_broadcasting = False



def broadcast_data():
    """Broadcast EEG data to all connected clients"""
    while is_broadcasting:
        try:
            # Get current analysis results
            results = eeg_processor.get_analysis_results()
            
            # Prepare data for transmission
            data = {
                'timestamp': time.time(),
                'wave_powers': results['wave_powers'],
                'wave_rankings': results['wave_rankings'],
                'wave_percentages': results['wave_percentages'],
                'dominant_state': results['dominant_state'],
                'raw_data': results['raw_data']
            }
            
            # Emit to all connected clients
            socketio.emit('eeg_data', data)
            
            # Sleep for a short interval
            time.sleep(0.1)  # 10 FPS
            
        except Exception as e:
            print(f"Error broadcasting data: {e}")
            break
    
    is_broadcasting = False

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('status', {'message': 'Connected to EEG server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('request_data')
def handle_data_request():
    """Handle client data request"""
    try:
        results = eeg_processor.get_analysis_results()
        data = {
            'timestamp': time.time(),
            'wave_powers': results['wave_powers'],
            'wave_rankings': results['wave_rankings'],
            'wave_percentages': results['wave_percentages'],
            'dominant_state': results['dominant_state'],
            'raw_data': results['raw_data']
        }
        emit('eeg_data', data)
    except Exception as e:
        emit('error', {'message': f'Error: {str(e)}'})

if __name__ == '__main__':
    print("Starting EEG Visualization Server...")
    print("Make sure your Muse 2 headband is connected and Muse Direct is running.")
    print("Open your browser and go to: http://localhost:5000")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True) 
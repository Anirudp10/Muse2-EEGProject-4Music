import time
import threading
from pylsl import StreamInlet, resolve_stream
import numpy as np

class MuseConnector:
    def __init__(self, eeg_processor):
        self.eeg_processor = eeg_processor
        self.inlet = None
        self.is_connected = False
        self.is_streaming = False
        self.streaming_thread = None
        
    def connect_to_muse(self, timeout=10):
        """Connect to Muse 2 headband via LSL"""
        try:
            print("Searching for Muse 2 headband...")
            
            # Resolve available streams
            streams = resolve_stream('type', 'EEG', timeout=timeout)
            
            if not streams:
                print("No Muse 2 headband found. Please ensure:")
                print("1. Muse 2 is turned on and paired with your computer")
                print("2. Muse Direct app is running and streaming to LSL")
                print("3. Bluetooth connection is active")
                return False
            
            # Connect to the first available stream
            self.inlet = StreamInlet(streams[0])
            self.is_connected = True
            
            # Get stream info
            info = self.inlet.info()
            print(f"Connected to: {info.name()}")
            print(f"Sample rate: {info.nominal_srate()} Hz")
            print(f"Channels: {info.channel_count()}")
            
            return True
            
        except Exception as e:
            print(f"Error connecting to Muse 2: {e}")
            return False
    
    def start_streaming(self):
        """Start streaming EEG data"""
        if not self.is_connected or not self.inlet:
            print("Not connected to Muse 2. Please connect first.")
            return False
        
        if self.is_streaming:
            print("Already streaming data.")
            return True
        
        self.is_streaming = True
        self.eeg_processor.start_processing()
        
        # Start streaming thread
        self.streaming_thread = threading.Thread(target=self._stream_data)
        self.streaming_thread.daemon = True
        self.streaming_thread.start()
        
        print("Started streaming EEG data...")
        return True
    
    def stop_streaming(self):
        """Stop streaming EEG data"""
        self.is_streaming = False
        self.eeg_processor.stop_processing()
        
        if self.streaming_thread:
            self.streaming_thread.join()
        
        print("Stopped streaming EEG data.")
    
    def disconnect(self):
        """Disconnect from Muse 2"""
        self.stop_streaming()
        self.is_connected = False
        self.inlet = None
        print("Disconnected from Muse 2.")
    
    def _stream_data(self):
        """Main data streaming loop"""
        while self.is_streaming:
            try:
                # Get sample from LSL stream
                sample, timestamp = self.inlet.pull_sample()
                
                if sample is not None:
                    # Convert to numpy array and add to processor
                    sample_array = np.array(sample)
                    self.eeg_processor.add_data(sample_array)
                
            except Exception as e:
                print(f"Error streaming data: {e}")
                break
        
        self.is_streaming = False
    
    def get_connection_status(self):
        """Get current connection status"""
        return {
            'connected': self.is_connected,
            'streaming': self.is_streaming,
            'has_inlet': self.inlet is not None
        } 
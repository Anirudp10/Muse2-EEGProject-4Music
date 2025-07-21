import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
import time
import threading
from collections import deque
import json

class EEGProcessor:
    def __init__(self, buffer_size=1000, sample_rate=256):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        
        # Frequency bands for different brainwaves
        self.frequency_bands = {
            'delta': (0.5, 4.0),
            'theta': (4.0, 8.0),
            'alpha': (8.0, 13.0),
            'beta': (13.0, 30.0),
            'gamma': (30.0, 100.0)
        }
        
        # Data buffers for each channel
        self.channels = ['TP9', 'AF7', 'AF8', 'TP10']
        self.data_buffers = {channel: deque(maxlen=buffer_size) for channel in self.channels}
        
        # Analysis results
        self.wave_powers = {wave: 0.0 for wave in self.frequency_bands.keys()}
        self.wave_rankings = []
        self.dominant_state = "Unknown"
        
        # Threading
        self.is_running = False
        self.processing_thread = None
        
    def add_data(self, channel_data):
        """Add new EEG data to the buffers"""
        for i, channel in enumerate(self.channels):
            if i < len(channel_data):
                self.data_buffers[channel].append(channel_data[i])
    
    def calculate_power_spectrum(self, data):
        """Calculate power spectrum using FFT"""
        if len(data) < 2:
            return np.array([]), np.array([])
        
        # Apply window function to reduce spectral leakage
        window = signal.hann(len(data))
        windowed_data = data * window
        
        # Perform FFT
        fft_result = fft(windowed_data)
        freqs = fftfreq(len(data), 1/self.sample_rate)
        
        # Calculate power spectrum (only positive frequencies)
        positive_freqs = freqs[:len(freqs)//2]
        power_spectrum = np.abs(fft_result[:len(freqs)//2])**2
        
        return positive_freqs, power_spectrum
    
    def calculate_band_power(self, freqs, power_spectrum, band_range):
        """Calculate power in a specific frequency band"""
        low_freq, high_freq = band_range
        
        # Find indices for the frequency band
        band_indices = np.where((freqs >= low_freq) & (freqs <= high_freq))[0]
        
        if len(band_indices) == 0:
            return 0.0
        
        # Calculate average power in the band
        band_power = np.mean(power_spectrum[band_indices])
        return band_power
    
    def analyze_brainwaves(self):
        """Analyze brainwave activity from all channels"""
        if not all(len(buffer) > 0 for buffer in self.data_buffers.values()):
            return
        
        # Combine data from all channels
        combined_data = np.mean([list(buffer) for buffer in self.data_buffers.values()], axis=0)
        
        # Calculate power spectrum
        freqs, power_spectrum = self.calculate_power_spectrum(combined_data)
        
        if len(freqs) == 0:
            return
        
        # Calculate power for each frequency band
        for wave_name, band_range in self.frequency_bands.items():
            self.wave_powers[wave_name] = self.calculate_band_power(freqs, power_spectrum, band_range)
        
        # Rank waves by activity
        self.rank_waves()
        
        # Determine dominant state
        self.determine_dominant_state()
    
    def rank_waves(self):
        """Rank brainwaves from most to least active"""
        sorted_waves = sorted(self.wave_powers.items(), key=lambda x: x[1], reverse=True)
        self.wave_rankings = sorted_waves
        
        # Calculate percentages
        total_power = sum(self.wave_powers.values())
        if total_power > 0:
            self.wave_percentages = {wave: (power/total_power)*100 for wave, power in self.wave_powers.items()}
        else:
            self.wave_percentages = {wave: 0.0 for wave in self.wave_powers.keys()}
    
    def determine_dominant_state(self):
        """Determine the current mental state based on dominant brainwave"""
        if not self.wave_rankings:
            self.dominant_state = "Unknown"
            return
        
        dominant_wave = self.wave_rankings[0][0]
        dominant_power = self.wave_rankings[0][1]
        
        # State interpretation based on dominant wave
        state_interpretations = {
            'delta': 'Deep Relaxation/Sleep',
            'theta': 'Creative/Meditative',
            'alpha': 'Relaxed Wakefulness',
            'beta': 'Active Thinking',
            'gamma': 'High-Level Processing'
        }
        
        # Only consider it a clear state if the dominant wave has significant power
        if dominant_power > 0.1:  # Threshold can be adjusted
            self.dominant_state = state_interpretations.get(dominant_wave, "Unknown")
        else:
            self.dominant_state = "Low Activity"
    
    def get_analysis_results(self):
        """Get current analysis results"""
        return {
            'wave_powers': self.wave_powers,
            'wave_rankings': self.wave_rankings,
            'wave_percentages': getattr(self, 'wave_percentages', {}),
            'dominant_state': self.dominant_state,
            'raw_data': {channel: list(buffer) for channel, buffer in self.data_buffers.items()}
        }
    
    def start_processing(self):
        """Start the processing thread"""
        if not self.is_running:
            self.is_running = True
            self.processing_thread = threading.Thread(target=self._processing_loop)
            self.processing_thread.daemon = True
            self.processing_thread.start()
    
    def stop_processing(self):
        """Stop the processing thread"""
        self.is_running = False
        if self.processing_thread:
            self.processing_thread.join()
    
    def _processing_loop(self):
        """Main processing loop"""
        while self.is_running:
            self.analyze_brainwaves()
            time.sleep(0.1)  # Update every 100ms 
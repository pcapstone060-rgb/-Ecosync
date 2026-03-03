import numpy as np

class KalmanFilter:
    def __init__(self):
        # Shared parameters
        self.F = np.array([[1, 1], [0, 1]])  # State transition matrix
        self.H = np.array([[1, 0]])          # Measurement matrix
        self.Q = np.eye(2) * 0.1             # Process noise covariance
        self.R = np.array([[0.1]])           # Measurement noise covariance

        # Separate states for different metrics
        self.states = {
            "temp": {"x": np.zeros((2, 1)), "P": np.eye(2)},
            "hum":  {"x": np.zeros((2, 1)), "P": np.eye(2)},
            "pm25": {"x": np.zeros((2, 1)), "P": np.eye(2)}
        }

    def _filter(self, key, measurement):
        state = self.states[key]
        x, P = state["x"], state["P"]

        # Prediction step
        x = self.F @ x
        P = self.F @ P @ self.F.T + self.Q

        # Update step
        S = self.H @ P @ self.H.T + self.R
        K = P @ self.H.T @ np.linalg.inv(S)
        x = x + K @ (measurement - self.H @ x)
        P = (np.eye(2) - K @ self.H) @ P

        # Save back
        state["x"], state["P"] = x, P
        return float(x[0, 0]), float(np.sqrt(P[0, 0]))

    def filter_temperature(self, measurement):
        return self._filter("temp", measurement)

    def filter_humidity(self, measurement):
        return self._filter("hum", measurement)

    def filter_pm25(self, measurement):
        return self._filter("pm25", measurement)

    def clean_mq_data(self, raw_value):
        # Simple moving average filter
        window_size = 5
        if not hasattr(self, 'mq_buffer'):
            self.mq_buffer = [raw_value] * window_size

        self.mq_buffer.pop(0)
        self.mq_buffer.append(raw_value)

        smoothed_value = sum(self.mq_buffer) / window_size

        # Z-score for outlier detection
        mean = sum(self.mq_buffer) / window_size
        variance = sum((x - mean) ** 2 for x in self.mq_buffer) / window_size
        std_dev = np.sqrt(variance) if variance > 0 else 1
        z_score = (raw_value - mean) / std_dev if std_dev > 0 else 0

        is_outlier = abs(z_score) > 2

        return {
            "smoothed": float(smoothed_value),
            "is_outlier": bool(is_outlier),
            "z_score": float(z_score)
        }

# Initialize Kalman filter instance
kalman_filter = KalmanFilter()
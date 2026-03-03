import serial
import serial.tools.list_ports
import json
import time

def scan():
    print("Searching for EcoSync hardware...")
    ports = serial.tools.list_ports.comports()
    for port in ports:
        print(f"Checking {port.device} ({port.description})...")
        try:
            with serial.Serial(port.device, 115200, timeout=2) as ser:
                # Read a few lines
                for _ in range(5):
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"  [{port.device}] Received: {line[:50]}...")
                        if '"temperature"' in line and '"humidity"' in line:
                            print(f"  !!! FOUND ECOSYNC ON {port.device} !!!")
                            return port.device
        except Exception as e:
            print(f"  [{port.device}] Could not open: {e}")
    print("Could not find hardware. Check connection.")
    return None

if __name__ == "__main__":
    scan()

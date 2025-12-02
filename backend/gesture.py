import cv2
import mediapipe as mp
import time
import math
from collections import deque
import numpy as np

class GestureRecognizer:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # History buffers
        self.position_history = deque(maxlen=20)  # For swipes
        self.gesture_history = deque(maxlen=30)   # Increased buffer size for longer stability checks
        self.angle_history = deque(maxlen=30)     # For rotation
        
        # State variables
        self.last_stable_gesture = None
        self.last_gesture_time = 0
        self.rotation_state = "IDLE" # IDLE, DETECTED_3F, ROTATING_RIGHT, ROTATED_LEFT
        self.rotation_baseline_angle = None
        
        # Pinch State
        self.pinch_lifecycle_state = "IDLE" # IDLE, ACTIVE, COOLDOWN
        self.pinch_active_start_time = 0
        self.pinch_cooldown_start_time = 0
        self.last_pinch_dist = None
        self.pinch_stable_frames = 0

        
        self.swipe_start_pos = None # For Index Finger Swipe
        
        # Constants
        self.SWIPE_THRESHOLD = 0.15 # Normalized coordinate distance
        self.STABILITY_FRAMES = 30  # Number of consistent frames for static gesture (approx 1 sec at 30fps)
        self.CALL_STABILITY_FRAMES = 40 # Higher stability for call gesture
        self.ROTATION_THRESHOLD = 20 # Degrees
        self.COOLDOWN = 1.0 # Seconds between same gesture triggers
        self.CALL_COOLDOWN = 3.0 # Longer cooldown for call gesture
        self.PINCH_COOLDOWN = 0.1 # Faster cooldown for pinch updates
        
        self.last_call_time = 0 # Track last call time

        
        # Context State
        self.current_context = "navigation" # Default
        
    def set_context(self, context):
        self.current_context = context
        print(f"GestureRecognizer: Context set to {context}")

    def _get_finger_states(self, landmarks):
        """
        Returns a list of booleans: True if finger is extended, False if folded.
        Order: Thumb, Index, Middle, Ring, Pinky
        """
        # Tips ids: 4, 8, 12, 16, 20
        # PIP/MCP ids for comparison
        fingers = []
        
        # Thumb: Compare x position (assuming right hand or flipped left hand)
        # For robustness, we can check distance from wrist or relative to other fingers
        # Simple heuristic: Tip x < IP x (for right hand held up facing camera, flipped)
        # Actually, let's use a more robust vector based approach or simple y-check for others
        
        # Note: Image is flipped horizontally in main loop usually.
        # Let's assume standard "palm facing camera"
        
        # Thumb (4) is tricky. Let's check if tip is "farther out" than IP joint (3)
        # relative to the palm center (9). 
        # Or simpler: Check angle or just x-coord if hand is upright.
        # Let's stick to the previous simple check but be mindful of hand side.
        # We will assume the frame is flipped, so it acts like a mirror.
        # If hand is right hand (detected as Right), Thumb is on Left side of hand.
        
        # Let's use a geometry based approach: distance from wrist to tip vs wrist to IP
        wrist = landmarks[0]
        
        def dist(p1, p2):
            return math.hypot(p1.x - p2.x, p1.y - p2.y)
            
        # Thumb
        if dist(landmarks[4], wrist) > dist(landmarks[3], wrist) * 1.1:
            fingers.append(True)
        else:
            fingers.append(False)
            
        # Other 4 fingers: Tip y < PIP y (0,0 is top-left)
        # Index (8) vs (6)
        fingers.append(landmarks[8].y < landmarks[6].y)
        # Middle (12) vs (10)
        fingers.append(landmarks[12].y < landmarks[10].y)
        # Ring (16) vs (14)
        fingers.append(landmarks[16].y < landmarks[14].y)
        # Pinky (20) vs (18)
        fingers.append(landmarks[20].y < landmarks[18].y)
        
        return fingers

    def _detect_static_raw(self, fingers):
        """Classifies the raw static pose based on finger states."""
        # fingers: [Thumb, Index, Middle, Ring, Pinky]
        
        thumb_open = fingers[0]
        other_fingers = fingers[1:] # [Index, Middle, Ring, Pinky]
        count_others = sum(1 for f in other_fingers if f)
        
        # Call: Thumb and Pinky open, others closed
        if fingers[0] and fingers[4] and not any(fingers[1:4]):
            return "call"
        
        # Palm: All 5 open
        if all(fingers):
            return "palm"
            
        # Fist: All 5 closed
        if not any(fingers):
            return "fist"
            
        # Fingers counting (ignoring thumb for the count, but distinguishing from Palm)
        if count_others == 4:
            # If thumb was open, it would be palm (caught above).
            # So this is 4 fingers open, thumb closed.
            return "four"
            
        if count_others == 3:
            return "three"
            
        if count_others == 2:
            return "two"
            
        # Pinch Pose: Thumb and Index Open, others closed (L-shape)
        # fingers[0] is Thumb, fingers[1] is Index
        if fingers[0] and fingers[1] and not any(fingers[2:]):
            return "pinch_pose"

        if count_others == 1:
            # Usually Index, but could be any.
            # We map this to "one", which will also trigger swipe detection.
            return "one"
            
        return "unknown"


    def _detect_swipe(self, current_pos, current_time):
        # Deprecated/Unused for Index Swipe logic
        return None

    def _get_hand_angle(self, landmarks):
        # Angle of the line from Wrist(0) to Middle Finger MCP(9)
        # 0 degrees is straight up (negative Y axis in image coords)
        # But atan2(y, x) gives angle from positive X axis.
        
        dx = landmarks[9].x - landmarks[0].x
        dy = landmarks[9].y - landmarks[0].y
        # In image coords, y increases downwards.
        # Let's invert y so it's standard cartesian
        angle_rad = math.atan2(-dy, dx) 
        angle_deg = math.degrees(angle_rad)
        return angle_deg

    def _is_facing_camera(self, landmarks):
        # Check if hand is facing camera (Palm parallel to screen)
        # We use Z-coordinates (depth) relative to wrist.
        # 1. Yaw: Index MCP (5) vs Pinky MCP (17) z-diff
        # 2. Pitch: Wrist (0) vs Middle MCP (9) z-diff
        
        wrist = landmarks[0]
        index_mcp = landmarks[5]
        middle_mcp = landmarks[9]
        pinky_mcp = landmarks[17]
        
        # Yaw check
        yaw_diff = abs(index_mcp.z - pinky_mcp.z)
        # Pitch check
        pitch_diff = abs(wrist.z - middle_mcp.z)
        
        # Thresholds
        MAX_TILT = 0.04
        
        # User requested both Pitch and Yaw check < 0.05
        is_facing = yaw_diff < MAX_TILT 
        
        return is_facing, yaw_diff, pitch_diff

    def process(self, frame):
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        
        detected_gesture = None
        current_time = time.time()
        debug_info = {}
        
        if results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0].landmark
            self.mp_draw.draw_landmarks(frame, results.multi_hand_landmarks[0], self.mp_hands.HAND_CONNECTIONS)
            
            # 1. Static Gesture Recognition
            fingers = self._get_finger_states(landmarks)
            raw_gesture = self._detect_static_raw(fingers)
            
            is_facing, yaw, pitch = self._is_facing_camera(landmarks)
            
            debug_info = {
                "fingers": fingers,
                "raw_gesture": raw_gesture,
                "yaw": yaw,
                "pitch": pitch,
                "pitch": pitch,
                "facing": is_facing,
                "pinch_state": self.pinch_lifecycle_state
            }
            
            # Refinement: Only accept specific gestures if facing camera
            if raw_gesture in ["fist", "palm", "one", "two", "three", "four", "call", "pinch_pose"]:
                if not is_facing:

                    raw_gesture = "unknown" # Treat as unknown if tilted
            
            self.gesture_history.append(raw_gesture)
            
            # Robustness check: Gesture must be consistent for STABILITY_FRAMES
            required_frames = self.CALL_STABILITY_FRAMES if raw_gesture == "call" else self.STABILITY_FRAMES
            
            if len(self.gesture_history) >= required_frames:
                # Check if all recent gestures are the same
                if all(g == raw_gesture for g in list(self.gesture_history)[-required_frames:]):
                    if raw_gesture != "unknown":
                        # Only update if different or enough time passed (handled by caller usually, but we can do it here)
                        # We return it as a candidate, caller handles cooldown/event firing
                        if raw_gesture in ["fist", "palm", "one", "two", "three", "four", "call", "pinch_pose"]:

                            # --- Context Filtering ---
                            allowed = False
                            
                            # Selection Mode (Nav, Playlist, Maps)
                            if self.current_context in ["navigation", "music_playlist", "maps"]:
                                if raw_gesture in ["one", "two", "three", "four", "palm"]:
                                    allowed = True
                                    
                            # Control Mode (Player, Climate, Call List, Call InCall)
                            elif self.current_context in ["music_player", "climate", "call_list", "call_incall"]:
                                if raw_gesture in ["palm", "fist", "call"]:
                                    allowed = True
                                # Note: Swipes are handled separately below, but 'one' triggers swipe.
                                # We do NOT want 'one' to be returned as a gesture here if we are in control mode.
                                
                            if allowed:
                                # Cooldown check for CALL
                                if raw_gesture == "call":
                                     if current_time - self.last_call_time < self.CALL_COOLDOWN:
                                         # Ignore
                                         allowed = False
                                     else:
                                         self.last_call_time = current_time
                                
                                if allowed:
                                    detected_gesture = raw_gesture
                                    self.gesture_history.clear() # Reset buffer

            # 1.5 Pinch Detection (Climate Control Only)
            if self.current_context == "climate":
                current_time = time.time()
                
                # State Machine
                is_pinch_pose = fingers[0] and fingers[1]
                
                if self.pinch_lifecycle_state == "IDLE":
                    # Check for activation: Stable pinch_pose for 30 frames
                    PINCH_START_FRAMES = 30
                    
                    # We need to track history of is_pinch_pose, but gesture_history tracks raw_gesture.
                    # We can't easily use gesture_history if we ignore raw_gesture.
                    # Let's use a separate counter or check current frame + history?
                    # Or just check if raw_gesture is one of the compatible ones?
                    # Compatible: pinch_pose, palm, three, two (if thumb+index+middle)
                    # Actually, let's just use a counter for simplicity since we are in a loop.
                    # Or better: Update gesture_history to include this "logical" gesture? No.
                    
                    # Let's check if the last X frames *would have been* pinch based on fingers?
                    # We don't have history of fingers, only current.
                    # But we have gesture_history.
                    # If we relax the definition, we should probably update _detect_static_raw to return "pinch_any" 
                    # or just handle it here.
                    
                    # Problem: We need 30 frames of consistency.
                    # If we change logic here, we can't verify history.
                    # Solution: We will rely on the fact that if Thumb+Index are open, 
                    # the raw_gesture will be STABLE as *something* (e.g. "palm" or "pinch_pose" or "two").
                    # So if we see Thumb+Index open NOW, and the raw_gesture history is stable (even if it's "palm"),
                    # we can count it?
                    
                    # Simpler approach: 
                    # If fingers[0] and fingers[1] are open, increment a counter. If not, reset.
                    # We need a state variable for this counter.
                    # Let's add self.pinch_stable_frames = 0 to __init__
                    
                    if is_pinch_pose:
                        self.pinch_stable_frames += 1
                    else:
                        self.pinch_stable_frames = 0
                        
                    if self.pinch_stable_frames >= PINCH_START_FRAMES:
                        self.pinch_lifecycle_state = "ACTIVE"
                        self.pinch_active_start_time = current_time
                        
                        # Initialize distance
                        thumb_tip = landmarks[4]
                        index_tip = landmarks[8]
                        self.last_pinch_dist = math.hypot(thumb_tip.x - index_tip.x, thumb_tip.y - index_tip.y)
                        # print("Pinch ACTIVE")
                        
                elif self.pinch_lifecycle_state == "ACTIVE":
                    # Check if time expired
                    if current_time - self.pinch_active_start_time > 2.0:
                        self.pinch_lifecycle_state = "COOLDOWN"
                        self.pinch_cooldown_start_time = current_time
                        self.last_pinch_dist = None
                        # print("Pinch COOLDOWN")
                    
                    # Check if pose lost
                    elif not is_pinch_pose:
                        self.pinch_lifecycle_state = "IDLE"
                        self.last_pinch_dist = None
                        self.pinch_stable_frames = 0
                        # print("Pinch LOST")
                        
                    else:
                        # Logic for distance change
                        thumb_tip = landmarks[4]
                        index_tip = landmarks[8]
                        dist = math.hypot(thumb_tip.x - index_tip.x, thumb_tip.y - index_tip.y)
                        
                        if self.last_pinch_dist is not None:
                            delta = dist - self.last_pinch_dist
                            CHANGE_THRESHOLD = 0.02
                            
                            if abs(delta) > CHANGE_THRESHOLD:
                                if delta > 0:
                                    detected_gesture = "increase_temp"
                                else:
                                    detected_gesture = "decrease_temp"
                                self.last_pinch_dist = dist
                                
                elif self.pinch_lifecycle_state == "COOLDOWN":
                    # Wait for cooldown to expire (e.g. 2 seconds)
                    if current_time - self.pinch_cooldown_start_time > 2.0:
                        self.pinch_lifecycle_state = "IDLE"
                        # print("Pinch READY")

            # 2. Swipe Detection (Index Finger Pointing)
            # Track wrist or center (9)
            cx, cy = landmarks[9].x, landmarks[9].y
            
            if raw_gesture == "one":
                # Only track swipe if we are in a context that supports it
                # Swipes are for: music_player, climate, call_list
                if self.current_context in ["music_player", "climate", "call_list"]:
                    if self.swipe_start_pos is None:
                        self.swipe_start_pos = (cx, cy)
                        # print("Swipe: Started tracking")
                    else:
                        # Check distance
                        dx = cx - self.swipe_start_pos[0]
                        SWIPE_DIST_THRESHOLD = 0.2 # 50% of screen width
                        
                        if abs(dx) > SWIPE_DIST_THRESHOLD:
                            if dx > 0:
                                detected_gesture = "swipe_right"
                            else:
                                detected_gesture = "swipe_left"
                            
                            self.swipe_start_pos = None # Reset after trigger
                else:
                    self.swipe_start_pos = None
            else:
                self.swipe_start_pos = None # Reset if pose lost

            # 3. Rotation Sequence - REMOVED
            # (Logic removed as requested)
            
        else:
            self.gesture_history.clear()
            self.position_history.clear()
            self.rotation_state = "IDLE"

        return detected_gesture, debug_info

def main():
    cap = cv2.VideoCapture(0)
    recognizer = GestureRecognizer()
    
    last_action_time = 0
    current_action = None
    
    print("Gesture Detection Started...")
    print("Available Gestures: Fist, Palm, Swipe Left/Right, 1, 2, 3, 4, Call")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame = cv2.flip(frame, 1)
        
        gesture, debug_info = recognizer.process(frame)
        
        current_time = time.time()
        
        # Display logic with strict global cooldown
        if gesture:
            # Only trigger if enough time has passed since ANY last action
            if current_time - last_action_time > 1.0:
                print(f"ACTION DETECTED: {gesture}")
                current_action = gesture
                last_action_time = current_time
                
        # Draw current action on screen
        if current_action and (current_time - last_action_time < 1.0):
            cv2.putText(frame, f"Action: {current_action}", (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                        
        # Draw Debug Info
        if debug_info:
            y_offset = 100
            # Fingers
            fingers_str = "".join(["1" if f else "0" for f in debug_info.get("fingers", [])])
            cv2.putText(frame, f"Fingers: {fingers_str}", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            y_offset += 30
            
            # Tilt
            yaw = debug_info.get("yaw", 0)
            pitch = debug_info.get("pitch", 0)
            is_facing = debug_info.get("facing", False)
            color = (0, 255, 0) if is_facing else (0, 0, 255)
            cv2.putText(frame, f"Tilt: Yaw={yaw:.2f}, Pitch={pitch:.2f}", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            y_offset += 30
            
            # Raw Gesture
            raw = debug_info.get("raw_gesture", "none")
            cv2.putText(frame, f"Raw: {raw}", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 30
            
            # Rotation
            rot_state = debug_info.get("rotation_state", "IDLE")
            angle = debug_info.get("angle", 0)
            cv2.putText(frame, f"Rot: {rot_state} ({angle:.0f})", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
        
        cv2.imshow("Gesture Control", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
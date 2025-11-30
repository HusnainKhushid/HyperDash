import unittest
from gesture import GestureRecognizer

class MockLandmark:
    def __init__(self, x, y, z=0):
        self.x = x
        self.y = y
        self.z = z

class TestGestureLogic(unittest.TestCase):
    def setUp(self):
        self.recognizer = GestureRecognizer()

    def test_palm(self):
        # All fingers open
        fingers = [True, True, True, True, True]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "palm")

    def test_fist(self):
        # All fingers closed
        fingers = [False, False, False, False, False]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "fist")

    def test_one(self):
        # Index open, others closed. Thumb ignored (can be True or False).
        # Case 1: Thumb closed
        fingers = [False, True, False, False, False]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "one")
        # Case 2: Thumb open (should still be one? No, if thumb is open and index is open, that's 2 fingers total.
        # But logic ignores thumb for COUNT.
        # Logic: count_others = 1.
        # If thumb is open, count_others is still 1.
        # So it should be "one".
        fingers = [True, True, False, False, False]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "one")

    def test_two(self):
        # Index + Middle open
        fingers = [False, True, True, False, False]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "two")

    def test_three(self):
        # Index + Middle + Ring open
        fingers = [False, True, True, True, False]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "three")

    def test_four(self):
        # Index + Middle + Ring + Pinky open. Thumb MUST be closed.
        fingers = [False, True, True, True, True]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "four")

    def test_four_vs_palm(self):
        # If thumb is also open, it's Palm
        fingers = [True, True, True, True, True]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "palm")

    def test_call(self):
        # Thumb and Pinky open, others closed
        fingers = [True, False, False, False, True]
        self.assertEqual(self.recognizer._detect_static_raw(fingers), "call")

if __name__ == '__main__':
    unittest.main()

#!/usr/bin/env python3
"""
train_gesture_mlp.py
Trains a robust Keras 3 MLP model for 1-5 hand gestures + background class.
Outputs models compatible with SmartAbility WebGL scanner via tensorflowjs_converter.

Classes:
  0: background / resting hand
  1: 1 finger (index)
  2: 2 fingers (index, middle)
  3: 3 fingers (index, middle, ring OR thumb, index, middle)
  4: 4 fingers (index, middle, ring, pinky)
  5: 5 fingers (open palm)

Input: [batch, 63] (21 landmarks x 3 coordinates normalized relative to wrist)
Output: [batch, 6] (Softmax probabilities)

Usage:
  python train_gesture_mlp.py --data_dir ./collected_gestures --epochs 50
  tensorflowjs_converter --input_format=keras_saved_model gesture_saved_model ../public/models/gesture
"""

import os
import json
import argparse
import numpy as np

# Force Keras 3 with TensorFlow backend
os.environ["KERAS_BACKEND"] = "tensorflow"
import keras
from keras import layers

def augment_landmarks(features_63, max_rotation_deg=15.0, scale_jitter=0.1, jitter_noise=0.015):
    """
    Augments 63-element landmark vector:
    1. Random in-plane 2D rotation (+- 15 deg) around wrist.
    2. Small uniform scale jitter (+- 10%).
    3. Gaussian coordinate jitter.
    4. Random X-mirroring for left/right hand invariance.
    """
    coords = features_63.reshape(21, 3).copy()
    
    # Random horizontal mirroring (left/right hand)
    if np.random.rand() > 0.5:
        coords[:, 0] = -coords[:, 0]

    # Random rotation in XY plane
    angle_rad = np.radians(np.random.uniform(-max_rotation_deg, max_rotation_deg))
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    rot_matrix = np.array([
        [cos_a, -sin_a, 0],
        [sin_a,  cos_a, 0],
        [0,      0,     1]
    ])
    coords = np.dot(coords, rot_matrix)

    # Scale jitter
    scale = np.random.uniform(1.0 - scale_jitter, 1.0 + scale_jitter)
    coords = coords * scale

    # Gaussian noise
    noise = np.random.normal(0, jitter_noise, coords.shape)
    coords += noise

    # Re-normalize to max absolute coordinate = 1.0
    max_val = np.max(np.abs(coords))
    if max_val > 0:
        coords = coords / max_val

    return coords.flatten()

def build_gesture_model(input_dim=63, num_classes=6):
    """
    Creates a Sequential Keras MLP matching SmartAbility topology:
    Dense(128) -> Dropout(0.25) -> Dense(64) -> Dropout(0.20) -> Dense(num_classes, softmax)
    """
    model = keras.Sequential([
        layers.Input(shape=(input_dim,), name="input_layer"),
        layers.Dense(128, activation="relu", name="dense"),
        layers.Dropout(0.25, name="dropout"),
        layers.Dense(64, activation="relu", name="dense_1"),
        layers.Dropout(0.20, name="dropout_1"),
        layers.Dense(num_classes, activation="softmax", name="dense_2")
    ], name="gesture_mlp")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def load_data(data_dir):
    """
    Loads JSON samples saved by the SmartAbility scanner dev mode.
    Format: {"mode": "gesture", "features": [...63 floats...], "label": 1}
    """
    X, y = [], []
    if not os.path.exists(data_dir):
        print(f"Warning: {data_dir} does not exist. Creating synthetic demonstration dataset.")
        # Generate synthetic data for demonstration / validation
        for label in range(6):
            for _ in range(100):
                base = np.random.uniform(-0.8, 0.8, size=(63,))
                X.append(base)
                y.append(label)
        return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)

    for fname in os.listdir(data_dir):
        if fname.endswith(".json"):
            with open(os.path.join(data_dir, fname), "r") as f:
                data = json.load(f)
                if "features" in data and "label" in data:
                    X.append(data["features"])
                    y.append(int(data["label"]))

    if len(X) == 0:
        raise ValueError(f"No valid labeled JSON samples found in {data_dir}")

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)

def main():
    parser = argparse.ArgumentParser(description="Train Hand Gesture MLP for SmartAbility")
    parser.add_argument("--data_dir", type=str, default="./collected_gestures", help="Directory with labeled JSON samples")
    parser.add_argument("--epochs", type=int, default=45, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--output_model", type=str, default="gesture_model.keras", help="Output Keras model path")
    args = parser.parse_args()

    print("[1/4] Loading dataset...")
    X_raw, y_raw = load_data(args.data_dir)
    print(f"Loaded {len(X_raw)} raw samples.")

    print("[2/4] Augmenting samples (mirroring, 2D rotation +-15 deg, scale jitter)...")
    X_augmented, y_augmented = [], []
    for feats, label in zip(X_raw, y_raw):
        X_augmented.append(feats)
        y_augmented.append(label)
        # Generate 5 augmented variants per sample
        for _ in range(5):
            X_augmented.append(augment_landmarks(feats))
            y_augmented.append(label)

    X_train = np.array(X_augmented, dtype=np.float32)
    y_train = np.array(y_augmented, dtype=np.int32)
    print(f"Dataset expanded to {len(X_train)} samples after augmentation.")

    print("[3/4] Building and training model...")
    model = build_gesture_model(input_dim=63, num_classes=6)
    model.summary()

    model.fit(
        X_train,
        y_train,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_split=0.15,
        shuffle=True
    )

    print(f"[4/4] Saving model to {args.output_model}...")
    model.save(args.output_model)
    print("\n✓ Training complete!")
    print("\nTo export to TensorFlow.js for the SmartAbility browser scanner, run:")
    print(f"  tensorflowjs_converter --input_format=keras {args.output_model} ../public/models/gesture")

if __name__ == "__main__":
    main()


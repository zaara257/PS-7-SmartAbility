#!/usr/bin/env python3
"""
train_mnist_digits.py
Trains a robust Keras 3 2D-CNN for handwritten digits 1-5 + background/noise.
Matches SmartAbility 28x28 grayscale WebGL tensor input format.

Classes:
  0: "1"
  1: "2"
  2: "3"
  3: "4"
  4: "5"

Input: [batch, 28, 28, 1] (Normalized Float32 in [0, 1])
Output: [batch, 5] (Softmax probabilities)

Usage:
  python train_mnist_digits.py --epochs 20
  tensorflowjs_converter --input_format=keras mnist_model.keras ../public/models/mnist-opencv-experiment
"""

import os
import argparse
import numpy as np

os.environ["KERAS_BACKEND"] = "tensorflow"
import keras
from keras import layers

def build_cnn_model(input_shape=(28, 28, 1), num_classes=5):
    """
    Builds the exact CNN topology deployed in SmartAbility:
    Conv2D(32, 3x3, same, relu) -> MaxPool(2x2) -> Dropout(0.12) ->
    Conv2D(64, 3x3, same, relu) -> MaxPool(2x2) -> Dropout(0.16) ->
    Flatten -> Dense(96, relu) -> Dropout(0.30) -> Dense(num_classes, softmax)
    """
    model = keras.Sequential([
        layers.Input(shape=input_shape, name="input_layer"),
        layers.Conv2D(32, (3, 3), padding="same", activation="relu", name="conv2d"),
        layers.MaxPooling2D((2, 2), name="max_pooling2d"),
        layers.Dropout(0.12, name="dropout"),

        layers.Conv2D(64, (3, 3), padding="same", activation="relu", name="conv2d_1"),
        layers.MaxPooling2D((2, 2), name="max_pooling2d_1"),
        layers.Dropout(0.16, name="dropout_1"),

        layers.Flatten(name="flatten"),
        layers.Dense(96, activation="relu", name="dense"),
        layers.Dropout(0.30, name="dropout_2"),
        layers.Dense(num_classes, activation="softmax", name="dense_1")
    ], name="mnist_digits_1_to_5_cnn")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def load_mnist_1_to_5_with_augmentation():
    """
    Loads standard MNIST dataset, filters for digits 1-5, re-indexes labels to 0-4,
    and applies random thickness, rotation (+-12 deg), translation, and noise augmentations.
    """
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

    # Filter only digits 1 through 5
    train_mask = (y_train >= 1) & (y_train <= 5)
    test_mask = (y_test >= 1) & (y_test <= 5)

    x_train, y_train = x_train[train_mask], y_train[train_mask]
    x_test, y_test = x_test[test_mask], y_test[test_mask]

    # Map labels: 1 -> 0, 2 -> 1, 3 -> 2, 4 -> 3, 5 -> 4
    y_train = y_train - 1
    y_test = y_test - 1

    # Normalize to [0, 1] Float32
    x_train = x_train.astype(np.float32) / 255.0
    x_test = x_test.astype(np.float32) / 255.0

    # Expand channel dimension: [N, 28, 28] -> [N, 28, 28, 1]
    x_train = np.expand_dims(x_train, axis=-1)
    x_test = np.expand_dims(x_test, axis=-1)

    print(f"Training samples: {len(x_train)}, Test samples: {len(x_test)}")
    return (x_train, y_train), (x_test, y_test)

def main():
    parser = argparse.ArgumentParser(description="Train MNIST Digits 1-5 CNN for SmartAbility")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--output_model", type=str, default="mnist_digits_1_to_5_cnn.keras", help="Output Keras model path")
    args = parser.parse_args()

    print("[1/3] Loading and preprocessing MNIST digits 1-5...")
    (x_train, y_train), (x_test, y_test) = load_mnist_1_to_5_with_augmentation()

    print("[2/3] Building model architecture...")
    model = build_cnn_model(input_shape=(28, 28, 1), num_classes=5)
    model.summary()

    # Data augmentation pipeline
    data_augmentation = keras.Sequential([
        layers.RandomRotation(0.04),      # ~+- 14 degrees
        layers.RandomTranslation(0.06, 0.06), # Slight translation
        layers.RandomZoom(0.06),          # Slight scaling
    ])

    print("[3/3] Training CNN with augmentation...")
    augmented_train_ds = (
        keras.ops.convert_to_tensor(x_train)
    )

    model.fit(
        data_augmentation(augmented_train_ds),
        y_train,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_data=(x_test, y_test),
        shuffle=True
    )

    test_loss, test_acc = model.evaluate(x_test, y_test)
    print(f"\nFinal Test Accuracy: {test_acc * 100:.2f}%")

    print(f"Saving model to {args.output_model}...")
    model.save(args.output_model)
    print("\n✓ Training complete!")
    print("\nTo export to TensorFlow.js for the SmartAbility browser scanner, run:")
    print(f"  tensorflowjs_converter --input_format=keras {args.output_model} ../public/models/mnist-opencv-experiment")

if __name__ == "__main__":
    main()


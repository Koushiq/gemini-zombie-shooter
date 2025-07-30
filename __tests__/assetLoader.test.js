/**
 * @fileoverview Unit tests for the public/assetLoader.js file.
 * This file tests the functionality of the assetLoader to ensure assets are loaded correctly.
 */

import { assetLoader } from '../public/assetLoader.js';

describe('Asset Loader', () => {
  // Mock Image and Audio constructors
  const mockImage = jest.fn(() => ({
    src: '',
    onload: null,
    onerror: null,
  }));
  const mockAudio = jest.fn(() => ({
    src: '',
    oncanplaythrough: null,
    onerror: null,
  }));

  beforeAll(() => {
    global.Image = mockImage;
    global.Audio = mockAudio;
  });

  beforeEach(() => {
    // Clear all instances and calls to constructors and all methods:
    mockImage.mockClear();
    mockAudio.mockClear();
    assetLoader.assets = {}; // Clear previously loaded assets
  });

  // Test case for loading image assets successfully
  it('should load image assets successfully', (done) => {
    const assetsToLoad = {
      testImage: 'test.png',
    };

    assetLoader.load(assetsToLoad, () => {
      expect(assetLoader.assets.testImage).toBeInstanceOf(mockImage);
      expect(assetLoader.assets.testImage.src).toBe('test.png');
      done();
    });

    // Simulate image load success
    mockImage.mock.results[0].value.onload();
  });

  // Test case for failing to load image assets
  it('should handle failed image asset loading', (done) => {
    const assetsToLoad = {
      testImage: 'test.png',
    };

    // Mock console.error to prevent actual error logging during test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    assetLoader.load(assetsToLoad, () => {
      expect(assetLoader.assets.testImage).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load image: test.png');
      consoleErrorSpy.mockRestore(); // Restore original console.error
      done();
    });

    // Simulate image load failure
    mockImage.mock.results[0].value.onerror();
  });

  // Test case for loading audio assets successfully
  it('should load audio assets successfully', (done) => {
    const assetsToLoad = {
      testAudio: 'test.wav',
    };

    assetLoader.load(assetsToLoad, () => {
      expect(assetLoader.assets.testAudio).toBeInstanceOf(mockAudio);
      expect(assetLoader.assets.testAudio.src).toBe('test.wav');
      done();
    });

    // Simulate audio load success
    mockAudio.mock.results[0].value.oncanplaythrough();
  });

  // Test case for failing to load audio assets
  it('should handle failed audio asset loading', (done) => {
    const assetsToLoad = {
      testAudio: 'test.wav',
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    assetLoader.load(assetsToLoad, () => {
      expect(assetLoader.assets.testAudio).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load audio: test.wav');
      consoleErrorSpy.mockRestore();
      done();
    });

    // Simulate audio load failure
    mockAudio.mock.results[0].value.onerror();
  });

  // Test case for loading no assets
  it('should call callback immediately if no assets to load', (done) => {
    const assetsToLoad = {};
    assetLoader.load(assetsToLoad, () => {
      expect(Object.keys(assetLoader.assets).length).toBe(0);
      done();
    });
  });
});
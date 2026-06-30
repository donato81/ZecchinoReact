import React from 'react';
import { Platform, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ActivityDetectorView } from '@/components/ActivityDetectorView';

describe('ActivityDetectorView - Unit Tests (Test 1-3)', () => {
  let onActivityMock: jest.Mock;

  beforeEach(() => {
    onActivityMock = jest.fn();
  });

  it('Test 1: Rilevatore touch - onStartShouldSetResponder chiama onActivity e ritorna false', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ActivityDetectorView onActivity={onActivityMock}>
          <React.Fragment />
        </ActivityDetectorView>
      );
    });

    const viewInstance = renderer.root.findByType(View);
    const onStartShouldSetResponder = viewInstance.props.onStartShouldSetResponder;
    
    let result!: boolean;
    act(() => {
      result = onStartShouldSetResponder();
    });

    expect(onActivityMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it('Test 2: Rilevatore touch - onMoveShouldSetResponder non chiama nulla e ritorna false', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ActivityDetectorView onActivity={onActivityMock}>
          <React.Fragment />
        </ActivityDetectorView>
      );
    });

    const viewInstance = renderer.root.findByType(View);
    const onMoveShouldSetResponder = viewInstance.props.onMoveShouldSetResponder;
    
    let result!: boolean;
    act(() => {
      result = onMoveShouldSetResponder();
    });

    expect(onActivityMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('Test 3: Piattaforma Windows - onKeyDown registrato ed esegue onActivity alla pressione di tasti', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      value: 'windows',
      configurable: true,
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ActivityDetectorView onActivity={onActivityMock}>
          <React.Fragment />
        </ActivityDetectorView>
      );
    });

    const viewInstance = renderer.root.findByType(View);
    
    expect(viewInstance.props.onKeyDown).toBeDefined();
    
    act(() => {
      viewInstance.props.onKeyDown();
    });
    
    expect(onActivityMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(Platform, 'OS', {
      value: originalOS,
      configurable: true,
    });
  });
});

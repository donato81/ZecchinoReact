import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { Button } from '@/components/ui/button';

describe('Button - Unit Tests (Test 4-7)', () => {
  it('Test 4: Rendering - renderizza correttamente il testo interno (children)', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Button>Test Text</Button>);
    });
    const textInstance = renderer.root.findByType(Text);
    expect(textInstance.props.children).toBe('Test Text');
  });

  it('Test 5: Interazione - la pressione del pulsante chiama la callback onPress', () => {
    const onPressMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Button onPress={onPressMock}>Button</Button>);
    });
    const touchableInstance = renderer.root.findByType(TouchableOpacity);
    
    act(() => {
      touchableInstance.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('Test 6: Fallback legacy - la pressione del pulsante chiama onClick se onPress è omesso', () => {
    const onClickMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Button onClick={onClickMock}>Button</Button>);
    });
    const touchableInstance = renderer.root.findByType(TouchableOpacity);
    
    act(() => {
      touchableInstance.props.onPress();
    });
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('Test 7: Pass-through - passa trasparente proprietà extra (es. disabled, accessibilityLabel) al TouchableOpacity nativo', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <Button disabled={true} accessibilityLabel="Custom Label">
          Button
        </Button>
      );
    });
    const touchableInstance = renderer.root.findByType(TouchableOpacity);
    
    expect(touchableInstance.props.disabled).toBe(true);
    expect(touchableInstance.props.accessibilityLabel).toBe('Custom Label');
  });
});

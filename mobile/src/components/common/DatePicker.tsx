import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  helperText?: string;
  editable?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
}

/**
 * KidVenture DatePicker Component
 * 
 * @example
 * <DatePicker
 *   label="Birthday"
 *   value={birthday}
 *   onChange={setBirthday}
 *   error={errors.birthday}
 * />
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  editable = true,
  maximumDate,
  minimumDate,
  placeholder = 'Select date',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
      setIsFocused(false);
    } else if (event.type === 'dismissed') {
      setIsFocused(false);
    }
  };

  const handlePress = () => {
    if (editable) {
      setIsFocused(true);
      setShowPicker(true);
    }
  };

  const getBorderClassName = () => {
    if (error) return 'border-error-500';
    if (isFocused) return 'border-primary-500';
    return 'border-gray-300';
  };

  const displayDate = value ? formatDateForDisplay(value) : '';

  return (
    <View className="mb-5">
      {label && (
        <Text className="text-sm font-medium text-gray-900 mb-2">{label}</Text>
      )}
      <TouchableOpacity
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <View
          className={`rounded-xl bg-white ${getBorderClassName()} ${isFocused ? 'border-2' : 'border'}`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isFocused ? 0.1 : 0.05,
            shadowRadius: 2,
            elevation: isFocused ? 2 : 1,
          }}
        >
          <View className="py-4 px-5 min-h-[56px] justify-center">
            <Text
              className={`text-base ${displayDate ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {displayDate || placeholder}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {error && (
        <Text className="text-sm text-error-500 mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-sm text-gray-600 mt-1">{helperText}</Text>
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowPicker(false);
            setIsFocused(false);
          }}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => {
              setShowPicker(false);
              setIsFocused(false);
            }}
          >
            <View 
              className="bg-white rounded-t-3xl"
              onStartShouldSetResponder={() => true}
              style={{ paddingBottom: 40 }}
            >
              <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">Select Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(false);
                    setIsFocused(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-primary-500 font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ 
                height: 250, 
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                paddingHorizontal: 20
              }}>
                <View style={{ 
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    textColor="#000000"
                    style={{ 
                      height: 250,
                      backgroundColor: '#ffffff'
                    }}
                    themeVariant="light"
                    locale="en_US"
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};


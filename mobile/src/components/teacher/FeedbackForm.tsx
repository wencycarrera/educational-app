import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { theme } from '../../config/theme';
import { FeedbackFormData, FeedbackCategory } from '../../types/feedback';

export interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  loading?: boolean;
}

/**
 * Feedback Form Component
 * Star rating and text feedback form
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [category, setCategory] = useState<FeedbackCategory>('general');

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (feedbackText.trim().length === 0) {
      Alert.alert('Feedback Required', 'Please provide your feedback.');
      return;
    }

    try {
      await onSubmit({
        rating,
        feedbackText: feedbackText.trim(),
        category,
      });
      
      // Reset form after successful submission
      setRating(0);
      setFeedbackText('');
      setCategory('general');
      
      Alert.alert('Success', 'Thank you for your feedback!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const categories: Array<{ value: FeedbackCategory; label: string }> = [
    { value: 'general', label: 'General' },
    { value: 'usability', label: 'Usability' },
    { value: 'educational', label: 'Educational' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card variant="elevated" padding="large" style={styles.card}>
        <Heading level="h3" style={styles.title}>
          Share Your Feedback
        </Heading>
        <Body size="medium" style={styles.subtitle}>
          Help us improve KidVenture by sharing your thoughts on app usability and educational effectiveness.
        </Body>

        {/* Category Selection */}
        <View style={styles.section}>
          <Body size="medium" style={styles.label}>
            Category
          </Body>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value)}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Body
                  size="small"
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Body>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.section}>
          <Body size="medium" style={styles.label}>
            Rating
          </Body>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={
                    star <= rating
                      ? theme.colors.warning[500]
                      : theme.colors.gray[300]
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Body size="small" style={styles.ratingText}>
              {rating} {rating === 1 ? 'star' : 'stars'}
            </Body>
          )}
        </View>

        {/* Feedback Text */}
        <View style={styles.section}>
          <Body size="medium" style={styles.label}>
            Your Feedback
          </Body>
          <Input
            placeholder="Share your thoughts, suggestions, or concerns..."
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
            numberOfLines={6}
            style={styles.textInput}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={rating === 0 || feedbackText.trim().length === 0}
          style={styles.submitButton}
        >
          Submit Feedback
        </Button>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
  },
  section: {
    marginBottom: theme.spacing[5],
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  categoryButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.background.light,
  },
  categoryButtonActive: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  categoryText: {
    color: theme.colors.text.secondary,
  },
  categoryTextActive: {
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  starContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  starButton: {
    padding: theme.spacing[1],
  },
  ratingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  textInput: {
    minHeight: 120,
    paddingTop: theme.spacing[3],
  },
  submitButton: {
    marginTop: theme.spacing[4],
  },
});


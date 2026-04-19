import React from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { theme } from '../../config/theme';

export interface ProgressChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 20;
const BAR_SPACING = 8;
const BAR_WIDTH = 40; // Fixed width for bars

/**
 * Progress Chart Component
 * Simple bar chart for progress visualization
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  data,
  maxValue,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - theme.spacing[12] - CHART_PADDING * 2;
  const barWidth = BAR_WIDTH;
  
  const calculatedMaxValue = maxValue || Math.max(...data.map((d) => d.value), 1);
  const maxBarHeight = CHART_HEIGHT - 40; // Leave space for labels

  if (data.length === 0) {
    return (
      <Card variant="elevated" padding="medium" style={styles.card}>
        <Heading level="h4" style={styles.title}>
          {title}
        </Heading>
        <View style={styles.emptyContainer}>
          <Heading level="h4" style={styles.emptyText}>
            No data available
          </Heading>
        </View>
      </Card>
    );
  }

  // Calculate if we need horizontal scrolling
  const totalBarsWidth = data.length * (barWidth + BAR_SPACING);
  const needsScroll = totalBarsWidth > chartWidth;

  return (
    <Card variant="elevated" padding="medium" style={styles.card}>
      <Heading level="h4" style={styles.title}>
        {title}
      </Heading>
      <View style={styles.chartContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={needsScroll}
          contentContainerStyle={[
            styles.barsContainer,
            needsScroll && { paddingHorizontal: CHART_PADDING },
          ]}
          style={styles.scrollView}
        >
          {data.map((item, index) => {
            const barHeight = (item.value / calculatedMaxValue) * maxBarHeight;
            const color = item.color || theme.colors.primary[500];

            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        height: barHeight,
                        backgroundColor: color,
                      },
                    ]}
                  />
                  <Text style={styles.barValue}>{item.value}</Text>
                </View>
                <Body size="small" style={styles.barLabel}>
                  {item.label.length > 10
                    ? item.label.substring(0, 10) + '...'
                    : item.label}
                </Body>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CHART_HEIGHT,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: CHART_HEIGHT + 40,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: CHART_HEIGHT,
    gap: BAR_SPACING,
    minWidth: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing[2],
  },
  bar: {
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing[1],
  },
  barValue: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  barLabel: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    width: BAR_WIDTH,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
  },
});


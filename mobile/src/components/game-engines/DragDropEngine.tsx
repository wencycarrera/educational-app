import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { Button } from '../common/Button';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { loadAssetImage, getAssetEmoji } from '../../utils/assetLoader';
import { Image } from 'expo-image';

type ObjectBehavior = 'move' | 'duplicate' | 'return';

interface DragDropEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

interface DraggableItem {
  id: string;
}

interface DropZoneLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Simplified, crash-safe drag/drop engine for generic counting activities.
 * Only generic mode is supported to avoid gesture/worklet complexity that was causing native crashes.
 */
export const DragDropEngine: React.FC<DragDropEngineProps> = ({ module, onComplete }) => {
  const layout = (module.data.layout as 'vertical' | 'horizontal' | 'grid') || 'vertical';
  const targetCount = (module.data.targetCount as number) ?? 5;
  const maxObjects = (module.data.maxObjects as number) ?? Math.max(targetCount, 12);
  const instruction = module.data.instruction || 'Drag items to match the target';
  const assetID = (module.data.assetID as string) || 'default';
  const objectBehavior = (module.data.objectBehavior as ObjectBehavior) || 'move';
  const showRealTimeCount = (module.data.showRealTimeCount as boolean) ?? true;

  const [sourceItems, setSourceItems] = useState<DraggableItem[]>([]);
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [highlightedDropZone, setHighlightedDropZone] = useState(false);

  const dropZoneLayout = useRef<DropZoneLayout | null>(null);
  const dropZoneRef = useRef<View | null>(null);

  // Shared drag state
  const activeDragId = useSharedValue<string | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const lastAbsoluteX = useSharedValue(0);
  const lastAbsoluteY = useSharedValue(0);

  // Initialize items once
  useEffect(() => {
    const items: DraggableItem[] = Array.from({ length: maxObjects }, (_, i) => ({
      id: `item-${i}`,
    }));
    setSourceItems(items);
  }, [maxObjects]);

  // Keep count in sync
  useEffect(() => {
    setCurrentCount(droppedItems.length);
  }, [droppedItems.length]);

  const resetDragVisuals = useCallback(() => {
    activeDragId.value = null;
    dragX.value = 0;
    dragY.value = 0;
    dragScale.value = 1;
    setHighlightedDropZone(false);
  }, [activeDragId, dragX, dragScale, dragY]);

  const checkCompletion = useCallback(
    (nextCount: number) => {
      if (nextCount >= targetCount) {
        setIsCompleted(true);
        setShowCongratsModal(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    },
    [targetCount],
  );

  const handleDrop = useCallback(
    (itemId: string, absoluteX: number, absoluteY: number) => {
      const layout = dropZoneLayout.current;
      if (!layout || !Number.isFinite(absoluteX) || !Number.isFinite(absoluteY)) {
        resetDragVisuals();
        return;
      }

      const isInside =
        absoluteX >= layout.x &&
        absoluteX <= layout.x + layout.width &&
        absoluteY >= layout.y &&
        absoluteY <= layout.y + layout.height;

      if (!isInside) {
        resetDragVisuals();
        return;
      }

      setDroppedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev;
        }
        const next = [...prev, itemId];
        if (objectBehavior === 'move') {
          setSourceItems((items) => items.filter((i) => i.id !== itemId));
        }
        checkCompletion(next.length);
        return next;
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      resetDragVisuals();
    },
    [checkCompletion, objectBehavior, resetDragVisuals],
  );

  const handleDropZoneLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    const view = dropZoneRef.current;
    if (view && typeof (view as any).measureInWindow === 'function') {
      (view as any).measureInWindow((mx: number, my: number, mw: number, mh: number) => {
        if ([mx, my, mw, mh].every((v) => Number.isFinite(v))) {
          dropZoneLayout.current = { x: mx, y: my, width: mw, height: mh };
        } else {
          dropZoneLayout.current = { x, y, width, height };
        }
      });
    } else {
      dropZoneLayout.current = { x, y, width, height };
    }
  }, []);

  const renderDroppedItems = useCallback(
    () =>
      droppedItems.map((id) => {
        const assetImage = loadAssetImage(assetID);
        const emoji = getAssetEmoji(assetID);
        return (
          <View key={id} style={styles.droppedItem}>
            {assetImage ? (
              <Image source={assetImage} style={styles.droppedItemImage} contentFit="contain" />
            ) : (
              <Text style={styles.droppedItemEmoji}>{emoji}</Text>
            )}
          </View>
        );
      }),
    [assetID, droppedItems],
  );

  const Draggable: React.FC<{ item: DraggableItem; isDropped: boolean }> = ({ item, isDropped }) => {
    // Skip rendering if moved away
    if (objectBehavior === 'move' && isDropped) {
      return null;
    }

    const animatedStyle = useAnimatedStyle(() => {
      const isActive = activeDragId.value === item.id;
      return {
        transform: isActive
          ? [
              { translateX: dragX.value },
              { translateY: dragY.value },
              { scale: dragScale.value },
            ]
          : [{ scale: 1 }],
        zIndex: isActive ? 10 : 1,
        opacity: isActive ? 0.92 : 1,
      };
    });

    const gesture = useMemo(
      () =>
        Gesture.Pan()
          .minDistance(0)
          .onStart(() => {
            'worklet';
            activeDragId.value = item.id;
            dragScale.value = withSpring(1.08);
            runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}))();
          })
          .onUpdate((e) => {
            'worklet';
            if (activeDragId.value !== item.id) return;
            dragX.value = e.translationX;
            dragY.value = e.translationY;
            lastAbsoluteX.value = e.absoluteX;
            lastAbsoluteY.value = e.absoluteY;
            const layout = dropZoneLayout.current;
            if (layout) {
              const inside =
                e.absoluteX >= layout.x &&
                e.absoluteX <= layout.x + layout.width &&
                e.absoluteY >= layout.y &&
                e.absoluteY <= layout.y + layout.height;
              runOnJS(setHighlightedDropZone)(inside);
            }
          })
          .onEnd((e) => {
            'worklet';
            const safeX = Number.isFinite(e.absoluteX) ? e.absoluteX : lastAbsoluteX.value;
            const safeY = Number.isFinite(e.absoluteY) ? e.absoluteY : lastAbsoluteY.value;
            runOnJS(handleDrop)(item.id, safeX, safeY);
          })
          .onFinalize(() => {
            'worklet';
            runOnJS(resetDragVisuals)();
          }),
      [handleDrop, item.id, resetDragVisuals],
    );

    const assetImage = loadAssetImage(assetID);
    const emoji = getAssetEmoji(assetID);

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.draggableItem, animatedStyle]}>
          {assetImage ? (
            <Image source={assetImage} style={styles.itemImage} contentFit="contain" />
          ) : (
            <Text style={styles.itemEmoji}>{emoji}</Text>
          )}
        </Animated.View>
      </GestureDetector>
    );
  };

  const handleModalClose = useCallback(() => {
    setShowCongratsModal(false);
    onComplete(100);
  }, [onComplete]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
          <View style={styles.progressContainer}>
            <Body size="medium" style={styles.progressText}>
              {showRealTimeCount ? `${currentCount} → ${targetCount}` : `${currentCount} / ${targetCount}`}
            </Body>
          </View>
        </View>

        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <Card variant="elevated" padding="medium" style={styles.sourceArea}>
            <Body size="small" style={styles.sectionLabel}>
              Drag from here:
            </Body>
            <View
              style={[
                styles.sourceGrid,
                layout === 'horizontal' && styles.sourceGridHorizontal,
                layout === 'grid' && styles.sourceGridGrid,
              ]}
            >
              {sourceItems.map((item) => (
                <Draggable key={item.id} item={item} isDropped={droppedItems.includes(item.id)} />
              ))}
            </View>
          </Card>

          <Card
            variant="elevated"
            padding="large"
            ref={dropZoneRef}
            onLayout={handleDropZoneLayout}
            style={[
              styles.dropZone,
              highlightedDropZone && styles.dropZoneHighlighted,
              droppedItems.length > 0 && styles.dropZoneActive,
            ]}
          >
            <View style={styles.dropZoneHeader}>
              <Text style={styles.dropZoneIcon}>🎯</Text>
              <Body size="medium" style={styles.dropZoneTitle}>
                Drop Zone {droppedItems.length > 0 && `(${droppedItems.length})`}
              </Body>
            </View>
            <View style={styles.dropZoneContent}>
              {droppedItems.length === 0 ? (
                <Body size="small" style={styles.dropHint}>
                  Drag items here
                </Body>
              ) : (
                <View style={styles.droppedItemsContainer}>{renderDroppedItems()}</View>
              )}
            </View>
          </Card>

          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button variant="primary" size="large" onPress={() => checkCompletion(droppedItems.length)} fullWidth>
                Check Answer
              </Button>
            </View>
          )}
        </GameSurface>
      </ScrollView>

      <CongratulationsModal
        visible={showCongratsModal}
        score={100}
        onClose={handleModalClose}
        title="Great Job!"
        message="You completed the activity!"
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  header: {
    marginBottom: theme.spacing[5],
  },
  instruction: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  gameCard: {
    marginBottom: theme.spacing[6],
  },
  gameArea: {
    gap: theme.spacing[3],
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  sourceArea: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
    minHeight: 150,
  },
  sectionLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    justifyContent: 'center',
  },
  sourceGridHorizontal: {
    flexDirection: 'column',
    maxHeight: 220,
  },
  sourceGridGrid: {
    justifyContent: 'flex-start',
  },
  draggableItem: {
    margin: theme.spacing[1],
  },
  itemImage: {
    width: 60,
    height: 60,
  },
  itemEmoji: {
    fontSize: 48,
  },
  dropZone: {
    backgroundColor: theme.colors.background.light,
    minHeight: 180,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderStyle: 'dashed',
    marginBottom: theme.spacing[4],
  },
  dropZoneActive: {
    borderColor: theme.colors.primary[500],
    borderStyle: 'solid',
    backgroundColor: theme.colors.primary[50],
  },
  dropZoneHighlighted: {
    borderColor: theme.colors.success[500],
    borderWidth: 3,
    backgroundColor: theme.colors.success[50],
  },
  dropZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  dropZoneIcon: {
    fontSize: 24,
  },
  dropZoneTitle: {
    fontWeight: '600',
  },
  dropZoneContent: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropHint: {
    color: theme.colors.text.secondary,
  },
  droppedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  droppedItem: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  droppedItemImage: {
    width: 60,
    height: 60,
  },
  droppedItemEmoji: {
    fontSize: 48,
  },
  buttonContainer: {
    marginBottom: theme.spacing[4],
  },
});
/**
 * Evidence Journal Screen (Ticket 009)
 * Displays list of user's evidences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/auth';
import { useEvidences } from '@/hooks/data/useEvidences';
import { CreateEvidenceForm } from '@/components/evidence/CreateEvidenceForm';
import { Button } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { Evidence } from '@/lib/supabase/types';

export default function EvidenceScreen() {
  const { user } = useAuth();
  const { evidences, loading, refetch } = useEvidences(user?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refetch();
  };

  const renderEvidenceItem = ({ item }: { item: Evidence }) => (
    <View style={styles.evidenceCard}>
      {/* Date header */}
      <Text style={styles.evidenceDate}>{formatDate(item.date)}</Text>

      {/* Type icon and title */}
      <View style={styles.evidenceHeader}>
        <Text style={styles.evidenceIcon}>{getTypeIcon(item.type)}</Text>
        <Text style={styles.evidenceTitle}>{item.title}</Text>
      </View>

      {/* Content based on type */}
      {item.type === 'image' && item.file_url && (
        <Image source={{ uri: item.file_url }} style={styles.evidenceImage} />
      )}

      {item.type === 'url' && item.content && (
        <TouchableOpacity
          onPress={() => openUrl(item.content!)}
          style={styles.evidenceUrlContainer}
        >
          <Text style={styles.evidenceUrl} numberOfLines={1}>
            {item.content}
          </Text>
          <Text style={styles.evidenceUrlHint}>タップして開く →</Text>
        </TouchableOpacity>
      )}

      {item.type === 'note' && item.content && (
        <Text style={styles.evidenceNote}>{item.content}</Text>
      )}

      {/* AI highlight score (if available) */}
      {item.ai_highlight_score !== null && (
        <View style={styles.highlightBadge}>
          <Text style={styles.highlightBadgeText}>
            ⭐ Day21ハイライト候補 ({Math.round(item.ai_highlight_score * 100)}%)
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📸</Text>
      <Text style={styles.emptyStateTitle}>まだエビデンスがありません</Text>
      <Text style={styles.emptyStateText}>
        達成した証拠を記録して、{'\n'}
        あなたの成長を可視化しましょう
      </Text>
      <Button
        title="最初のエビデンスを追加"
        onPress={() => setShowCreateModal(true)}
        style={styles.emptyStateButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evidence Journal</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ 追加</Text>
        </TouchableOpacity>
      </View>

      {/* Evidence list */}
      <FlatList
        data={evidences}
        renderItem={renderEvidenceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      />

      {/* Create evidence modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <CreateEvidenceForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </View>
  );
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'image':
      return '📸';
    case 'url':
      return '🔗';
    case 'note':
      return '📝';
    default:
      return '📄';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `📅 ${year}年${month}月${day}日`;
}

/**
 * Safely open URL, adding https:// if protocol is missing
 */
async function openUrl(url: string): Promise<void> {
  let finalUrl = url.trim();

  // Add https:// if no protocol specified
  if (!finalUrl.match(/^[a-zA-Z]+:\/\//)) {
    finalUrl = `https://${finalUrl}`;
  }

  try {
    const canOpen = await Linking.canOpenURL(finalUrl);
    if (canOpen) {
      await Linking.openURL(finalUrl);
    } else {
      console.error('Cannot open URL:', finalUrl);
      // Could show Alert here, but avoiding Alert import for now
    }
  } catch (error) {
    console.error('Error opening URL:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.background,
    fontWeight: '600',
  },
  list: {
    padding: spacing.xl,
  },
  evidenceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  evidenceDate: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  evidenceIcon: {
    fontSize: fontSizes.xl,
  },
  evidenceTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  evidenceUrlContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceUrl: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  evidenceUrlHint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  evidenceNote: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
  highlightBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accent + '20',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  highlightBadgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * typography.body.lineHeight,
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    paddingHorizontal: spacing.xl,
  },
});

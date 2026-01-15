import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/auth';
import { useMapNodesGrouped } from '@/hooks/data/useMapNodes';
import { MapNode, MapNodeType } from '@/lib/supabase/types';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

type TabType = 'core' | 'traits' | 'achievements';

const TAB_CONFIG: Record<TabType, { label: string; types: MapNodeType[] }> = {
  core: { label: '核心', types: ['vow', 'meaning'] },
  traits: { label: '特性', types: ['value', 'strength', 'anti_pattern'] },
  achievements: { label: '成果', types: ['achievement'] },
};

const TYPE_LABELS: Record<MapNodeType, { label: string; icon: string }> = {
  vow: { label: '誓い', icon: '⭐' },
  meaning: { label: '意味', icon: '📍' },
  value: { label: '価値観', icon: '💎' },
  strength: { label: '強み', icon: '💪' },
  anti_pattern: { label: '逃げ癖', icon: '⚔️' },
  achievement: { label: '成果物', icon: '🏆' },
};

export default function CognitiveMapScreen() {
  const { user } = useAuth();
  const {
    vow,
    meaning,
    values,
    strengths,
    antiPatterns,
    achievements,
    loading,
    error,
    addNode,
    updateNode,
    deleteNode,
    getNodeVersions,
  } = useMapNodesGrouped(user?.id);

  const [activeTab, setActiveTab] = useState<TabType>('core');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newNodeType, setNewNodeType] = useState<MapNodeType>('value');
  const [newNodeContent, setNewNodeContent] = useState('');
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEditNode = (node: MapNode) => {
    setSelectedNode(node);
    setEditContent(node.content);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedNode || !editContent.trim()) return;

    try {
      setSaving(true);
      await updateNode(selectedNode.id, { content: editContent.trim() });
      setEditModalVisible(false);
      setSelectedNode(null);
    } catch (err) {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async (node: MapNode) => {
    // Don't allow deleting vow or meaning
    if (node.type === 'vow' || node.type === 'meaning') {
      Alert.alert('削除不可', '誓いと意味は削除できません');
      return;
    }

    Alert.alert(
      '削除確認',
      `「${node.content.substring(0, 30)}...」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNode(node.id);
            } catch (err) {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleAddNode = async () => {
    if (!newNodeContent.trim()) return;

    try {
      setSaving(true);
      await addNode({
        type: newNodeType,
        content: newNodeContent.trim(),
        source_type: 'manual',
      });
      setAddModalVisible(false);
      setNewNodeContent('');
    } catch (err) {
      Alert.alert('エラー', '追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleShowHistory = async (node: MapNode) => {
    try {
      const versions = await getNodeVersions(node.id);
      setNodeHistory([
        { version: node.version, content: node.content, edited_at: node.updated_at, current: true },
        ...versions,
      ]);
      setSelectedNode(node);
      setHistoryModalVisible(true);
    } catch (err) {
      Alert.alert('エラー', '履歴の取得に失敗しました');
    }
  };

  const openAddModal = (type: MapNodeType) => {
    setNewNodeType(type);
    setNewNodeContent('');
    setAddModalVisible(true);
  };

  const renderNodeCard = (node: MapNode) => {
    const typeConfig = TYPE_LABELS[node.type];
    const isCoretype = node.type === 'vow' || node.type === 'meaning';

    return (
      <View key={node.id} style={[styles.nodeCard, isCoretype && styles.coreCard]}>
        <View style={styles.nodeHeader}>
          <Text style={styles.nodeIcon}>{typeConfig.icon}</Text>
          <Text style={styles.nodeType}>{typeConfig.label}</Text>
          {node.version > 1 && (
            <Text style={styles.nodeVersion}>v{node.version}</Text>
          )}
        </View>
        <Text style={styles.nodeContent}>{node.content}</Text>
        <View style={styles.nodeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditNode(node)}
          >
            <Text style={styles.actionButtonText}>編集</Text>
          </TouchableOpacity>
          {node.version > 1 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShowHistory(node)}
            >
              <Text style={styles.actionButtonText}>履歴</Text>
            </TouchableOpacity>
          )}
          {!isCoretype && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteNode(node)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>削除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'core':
        return (
          <View>
            {vow && renderNodeCard(vow)}
            {meaning && renderNodeCard(meaning)}
            {!vow && !meaning && (
              <Text style={styles.emptyText}>
                Day0を完了すると、誓いと意味が表示されます
              </Text>
            )}
          </View>
        );
      case 'traits':
        return (
          <View>
            {/* Values */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💎 価値観</Text>
                <TouchableOpacity
                  style={styles.addSectionButton}
                  onPress={() => openAddModal('value')}
                >
                  <Text style={styles.addSectionButtonText}>+ 追加</Text>
                </TouchableOpacity>
              </View>
              {values.length > 0 ? (
                values.map(renderNodeCard)
              ) : (
                <Text style={styles.emptyText}>価値観を追加してください</Text>
              )}
            </View>

            {/* Strengths */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💪 強み</Text>
                <TouchableOpacity
                  style={styles.addSectionButton}
                  onPress={() => openAddModal('strength')}
                >
                  <Text style={styles.addSectionButtonText}>+ 追加</Text>
                </TouchableOpacity>
              </View>
              {strengths.length > 0 ? (
                strengths.map(renderNodeCard)
              ) : (
                <Text style={styles.emptyText}>強みを追加してください</Text>
              )}
            </View>

            {/* Anti-Patterns */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚔️ 逃げ癖</Text>
                <TouchableOpacity
                  style={styles.addSectionButton}
                  onPress={() => openAddModal('anti_pattern')}
                >
                  <Text style={styles.addSectionButtonText}>+ 追加</Text>
                </TouchableOpacity>
              </View>
              {antiPatterns.length > 0 ? (
                antiPatterns.map(renderNodeCard)
              ) : (
                <Text style={styles.emptyText}>Day0で逃げ癖が抽出されます</Text>
              )}
            </View>
          </View>
        );
      case 'achievements':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 成果物</Text>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={() => openAddModal('achievement')}
              >
                <Text style={styles.addSectionButtonText}>+ 追加</Text>
              </TouchableOpacity>
            </View>
            {achievements.length > 0 ? (
              achievements.map(renderNodeCard)
            ) : (
              <Text style={styles.emptyText}>
                Evidenceを追加すると、成果物として登録できます
              </Text>
            )}
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>エラーが発生しました</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cognitive Map</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {TAB_CONFIG[tab].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderTabContent()}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedNode && TYPE_LABELS[selectedNode.type].label}を編集
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              placeholder="内容を入力..."
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {TYPE_LABELS[newNodeType].icon} {TYPE_LABELS[newNodeType].label}を追加
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newNodeContent}
              onChangeText={setNewNodeContent}
              multiline
              placeholder="内容を入力..."
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddNode}
                disabled={saving || !newNodeContent.trim()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>追加</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>編集履歴</Text>
            <ScrollView style={styles.historyList}>
              {nodeHistory.map((version, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyVersion}>
                      v{version.version} {version.current && '(現在)'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(version.edited_at).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  <Text style={styles.historyContent}>{version.content}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginTop: spacing.md }]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  addSectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  addSectionButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  nodeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  coreCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nodeIcon: {
    fontSize: fontSizes.lg,
    marginRight: spacing.xs,
  },
  nodeType: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  nodeVersion: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeContent: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: fontSizes.base * 1.5,
  },
  nodeActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  actionButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  emptyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.accent,
  },
  saveButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: '#FFF',
    fontWeight: '600',
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  historyVersion: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  historyDate: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  historyContent: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
});
